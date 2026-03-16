import sys
import unicodedata
from pathlib import Path

from sqlalchemy import text


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.db.database import engine


def normalize_name(name: str) -> str:
    compact = " ".join((name or "").strip().split())
    ascii_like = "".join(
        char for char in unicodedata.normalize("NFKD", compact)
        if not unicodedata.combining(char)
    )
    return ascii_like.casefold()


def main() -> None:
    with engine.begin() as conn:
        dish_rows = conn.execute(
            text("SELECT dish_id, course_type, dish_name FROM dbo.dim_dishes ORDER BY dish_id")
        ).mappings().all()

        canonical_ids: dict[tuple[str, str], int] = {}
        replacement_map: dict[int, int] = {}

        for row in dish_rows:
            old_id = int(row["dish_id"])
            key = (
                str(row["course_type"] or "").strip().lower(),
                normalize_name(str(row["dish_name"] or "")),
            )
            if key not in canonical_ids:
                canonical_ids[key] = old_id
            replacement_map[old_id] = canonical_ids[key]

        duplicate_ids = [old_id for old_id, keep_id in replacement_map.items() if old_id != keep_id]
        print(f"Platos duplicados a fusionar: {len(duplicate_ids)}")

        for old_id, keep_id in replacement_map.items():
            if old_id == keep_id:
                continue
            conn.execute(
                text("UPDATE dbo.fact_menu_items SET dish_id = :keep_id WHERE dish_id = :old_id"),
                {"keep_id": keep_id, "old_id": old_id},
            )

        conn.execute(
            text(
                """
                WITH duplicates AS (
                    SELECT item_id,
                           ROW_NUMBER() OVER (PARTITION BY menu_id, dish_id ORDER BY item_id) AS row_num
                    FROM dbo.fact_menu_items
                )
                DELETE FROM duplicates
                WHERE row_num > 1
                """
            )
        )

        for old_id in duplicate_ids:
            conn.execute(
                text("DELETE FROM dbo.dim_dishes WHERE dish_id = :dish_id"),
                {"dish_id": old_id},
            )

        has_includes_drink = conn.execute(
            text(
                """
                SELECT 1
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'fact_menus' AND COLUMN_NAME = 'includes_drink'
                """
            )
        ).first() is not None

        dishes = conn.execute(
            text("SELECT dish_id, course_type, dish_name FROM dbo.dim_dishes ORDER BY dish_id")
        ).mappings().all()

        if has_includes_drink:
            menus = conn.execute(
                text("SELECT menu_id, date_id, restaurant_id, includes_drink FROM dbo.fact_menus ORDER BY menu_id")
            ).mappings().all()
        else:
            menus = conn.execute(
                text(
                    "SELECT menu_id, date_id, restaurant_id, CAST(0 AS BIT) AS includes_drink FROM dbo.fact_menus ORDER BY menu_id"
                )
            ).mappings().all()

        items = conn.execute(
            text("SELECT item_id, menu_id, dish_id FROM dbo.fact_menu_items ORDER BY item_id")
        ).mappings().all()

        dish_id_map = {int(row["dish_id"]): index + 1 for index, row in enumerate(dishes)}
        menu_id_map = {int(row["menu_id"]): index + 1 for index, row in enumerate(menus)}

        new_dishes = [
            (dish_id_map[int(row["dish_id"])], row["course_type"], row["dish_name"])
            for row in dishes
        ]
        new_menus = [
            (
                menu_id_map[int(row["menu_id"])],
                int(row["date_id"]),
                int(row["restaurant_id"]),
                int(row["includes_drink"]) if row["includes_drink"] is not None else 0,
            )
            for row in menus
        ]
        new_items = [
            (
                index + 1,
                menu_id_map[int(row["menu_id"])],
                dish_id_map[int(row["dish_id"])],
            )
            for index, row in enumerate(items)
            if int(row["menu_id"]) in menu_id_map and int(row["dish_id"]) in dish_id_map
        ]

        conn.execute(text("ALTER TABLE dbo.fact_menu_items DROP CONSTRAINT FK_MenuItems_Dishes"))
        conn.execute(text("ALTER TABLE dbo.fact_menu_items DROP CONSTRAINT FK_MenuItems_Menus"))

        conn.execute(text("TRUNCATE TABLE dbo.fact_menu_items"))
        conn.execute(text("TRUNCATE TABLE dbo.fact_menus"))
        conn.execute(text("TRUNCATE TABLE dbo.dim_dishes"))

        conn.execute(text("SET IDENTITY_INSERT dbo.dim_dishes ON"))
        for dish_id, course_type, dish_name in new_dishes:
            conn.execute(
                text(
                    "INSERT INTO dbo.dim_dishes (dish_id, course_type, dish_name) VALUES (:dish_id, :course_type, :dish_name)"
                ),
                {"dish_id": dish_id, "course_type": course_type, "dish_name": dish_name},
            )
        conn.execute(text("SET IDENTITY_INSERT dbo.dim_dishes OFF"))

        conn.execute(text("SET IDENTITY_INSERT dbo.fact_menus ON"))
        if has_includes_drink:
            for menu_id, date_id, restaurant_id, includes_drink in new_menus:
                conn.execute(
                    text(
                        "INSERT INTO dbo.fact_menus (menu_id, date_id, restaurant_id, includes_drink) VALUES (:menu_id, :date_id, :restaurant_id, :includes_drink)"
                    ),
                    {
                        "menu_id": menu_id,
                        "date_id": date_id,
                        "restaurant_id": restaurant_id,
                        "includes_drink": includes_drink,
                    },
                )
        else:
            for menu_id, date_id, restaurant_id, _ in new_menus:
                conn.execute(
                    text(
                        "INSERT INTO dbo.fact_menus (menu_id, date_id, restaurant_id) VALUES (:menu_id, :date_id, :restaurant_id)"
                    ),
                    {
                        "menu_id": menu_id,
                        "date_id": date_id,
                        "restaurant_id": restaurant_id,
                    },
                )
        conn.execute(text("SET IDENTITY_INSERT dbo.fact_menus OFF"))

        conn.execute(text("SET IDENTITY_INSERT dbo.fact_menu_items ON"))
        for item_id, menu_id, dish_id in new_items:
            conn.execute(
                text(
                    "INSERT INTO dbo.fact_menu_items (item_id, menu_id, dish_id) VALUES (:item_id, :menu_id, :dish_id)"
                ),
                {"item_id": item_id, "menu_id": menu_id, "dish_id": dish_id},
            )
        conn.execute(text("SET IDENTITY_INSERT dbo.fact_menu_items OFF"))

        conn.execute(
            text(
                "ALTER TABLE dbo.fact_menu_items WITH CHECK ADD CONSTRAINT FK_MenuItems_Dishes FOREIGN KEY(dish_id) REFERENCES dbo.dim_dishes(dish_id)"
            )
        )
        conn.execute(text("ALTER TABLE dbo.fact_menu_items CHECK CONSTRAINT FK_MenuItems_Dishes"))
        conn.execute(
            text(
                "ALTER TABLE dbo.fact_menu_items WITH CHECK ADD CONSTRAINT FK_MenuItems_Menus FOREIGN KEY(menu_id) REFERENCES dbo.fact_menus(menu_id)"
            )
        )
        conn.execute(text("ALTER TABLE dbo.fact_menu_items CHECK CONSTRAINT FK_MenuItems_Menus"))

        max_dish_id = int(conn.execute(text("SELECT ISNULL(MAX(dish_id), 0) FROM dbo.dim_dishes")).scalar() or 0)
        max_menu_id = int(conn.execute(text("SELECT ISNULL(MAX(menu_id), 0) FROM dbo.fact_menus")).scalar() or 0)
        max_item_id = int(conn.execute(text("SELECT ISNULL(MAX(item_id), 0) FROM dbo.fact_menu_items")).scalar() or 0)

        conn.execute(text(f"DBCC CHECKIDENT ('dbo.dim_dishes', RESEED, {max_dish_id})"))
        conn.execute(text(f"DBCC CHECKIDENT ('dbo.fact_menus', RESEED, {max_menu_id})"))
        conn.execute(text(f"DBCC CHECKIDENT ('dbo.fact_menu_items', RESEED, {max_item_id})"))

    print("OK: limpieza y renumeración completadas")


if __name__ == "__main__":
    main()