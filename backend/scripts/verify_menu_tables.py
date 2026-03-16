import json
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
        counts = {
            "dim_dishes": int(conn.execute(text("SELECT COUNT(*) FROM dbo.dim_dishes")).scalar() or 0),
            "fact_menus": int(conn.execute(text("SELECT COUNT(*) FROM dbo.fact_menus")).scalar() or 0),
            "fact_menu_items": int(conn.execute(text("SELECT COUNT(*) FROM dbo.fact_menu_items")).scalar() or 0),
        }

        dish_rows = conn.execute(
            text("SELECT dish_id, course_type, dish_name FROM dbo.dim_dishes ORDER BY dish_id")
        ).mappings().all()

        grouped_dishes: dict[tuple[str, str], list[int]] = {}
        for row in dish_rows:
            key = (
                str(row["course_type"] or "").strip().lower(),
                normalize_name(str(row["dish_name"] or "")),
            )
            grouped_dishes.setdefault(key, []).append(int(row["dish_id"]))

        duplicate_dish_groups = [dish_ids for dish_ids in grouped_dishes.values() if len(dish_ids) > 1]

        duplicate_menu_item_groups = int(
            conn.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM (
                        SELECT menu_id, dish_id
                        FROM dbo.fact_menu_items
                        GROUP BY menu_id, dish_id
                        HAVING COUNT(*) > 1
                    ) duplicates
                    """
                )
            ).scalar()
            or 0
        )

        id_checks = {}
        for table_name, column_name in (
            ("dim_dishes", "dish_id"),
            ("fact_menus", "menu_id"),
            ("fact_menu_items", "item_id"),
        ):
            min_id, max_id, total_count = conn.execute(
                text(f"SELECT MIN({column_name}), MAX({column_name}), COUNT(*) FROM dbo.{table_name}")
            ).one()
            min_id = int(min_id or 0)
            max_id = int(max_id or 0)
            total_count = int(total_count or 0)
            id_checks[table_name] = {
                "min": min_id,
                "max": max_id,
                "count": total_count,
                "contiguous": total_count == 0 or (min_id == 1 and max_id == total_count),
            }

        foreign_keys = [
            row[0]
            for row in conn.execute(
                text(
                    """
                    SELECT name
                    FROM sys.foreign_keys
                    WHERE name IN ('FK_MenuItems_Dishes', 'FK_MenuItems_Menus')
                    ORDER BY name
                    """
                )
            ).all()
        ]

    print(
        json.dumps(
            {
                "counts": counts,
                "duplicate_dish_groups": duplicate_dish_groups,
                "duplicate_menu_item_groups": duplicate_menu_item_groups,
                "id_checks": id_checks,
                "foreign_keys": foreign_keys,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()