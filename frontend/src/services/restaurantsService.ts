export async function deleteRestaurant(restaurantId: number, token: string): Promise<any> {
    const response = await fetch(`/restaurants/${restaurantId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
    })
    
    if (!response.ok) {
        throw new Error('No se pudo eliminar el restaurante.')
    }
  
    return response.json()
  }
