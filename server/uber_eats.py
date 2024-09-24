import json
import random
import re

# Load the data (assume it's in a file named 'grocery_data.json')
with open("data/uber_eats_restaurants.json", "r") as f:
    data = json.load(f)


def search_restaurants(query, location):
    """
    Search for restaurants based on name, tags, or location.

    :param query: String to search for in restaurant name or tags
    :param location: String to search for in restaurant location
    :return: List of matching restaurants
    """
    results = []
    query = query.lower()
    location = location.lower()

    for restaurant in data:
        restaurant_name = restaurant["name"].lower()
        restaurant_tags = [tag.lower() for tag in restaurant["tags"]]
        restaurant_location = f"{restaurant['location']['city']}, {restaurant['location']['state']}".lower()

        if re.search(query, restaurant_name) or any(
            re.search(query, tag) for tag in restaurant_tags
        ):
            results.append(restaurant)

    return results


def get_menu(restaurant_id):
    """
    Get the menu (menu_item list) for a specific restaurant.

    :param restaurant_id: ID of the restaurant
    :return: List of menu for the restaurant, or None if restaurant not found
    """
    for restaurant in data:
        if restaurant["id"] == restaurant_id:
            return restaurant["menu"]
    return None


def create_order(restaurant_id, items):
    """
    Create an order for a specific restaurant.

    :param restaurant_id: ID of the restaurant
    :param items: List of dictionaries, each containing 'id' and 'quantity'
    :return: Dictionary with order details, or None if restaurant not found
    """
    restaurant = next((s for s in data if s["id"] == restaurant_id), None)
    if not restaurant:
        return None

    order = {"restaurant_name": restaurant["name"], "items": [], "total": 0}

    for item in items:
        menu_item = next((p for p in restaurant["menu"] if p["id"] == item["id"]), None)
        if menu_item:
            quantity = item["quantity"]
            item_total = menu_item["price"] * quantity
            order["items"].append(
                {
                    "name": menu_item["name"],
                    "quantity": quantity,
                    "price": menu_item["price"],
                    "total": item_total,
                }
            )
            order["total"] += item_total

    return order


# Example usage:
if __name__ == "__main__":
    # Search for restaurants
    print("Searching for seafood restaurants in Seattle:")
    results = search_restaurants("seafood", "Seattle")
    for restaurant in results:
        print(f"- {restaurant['name']}")

    if results:
        # Choose the first result to order from
        chosen_restaurant = results[0]
        print(
            f"\nChosen restaurant: {chosen_restaurant['name']} (ID: {chosen_restaurant['id']})"
        )

        # Get and print all menu items
        print("\nFull menu:")
        menu = get_menu(chosen_restaurant["id"])
        if menu:
            for item in menu:
                print(f"- {item['name']}: ${item['price']}")

        # Choose a random sample of items to order
        num_items_to_order = random.randint(
            1, min(5, len(menu))
        )  # Order between 1 and 5 items
        items_to_order = random.sample(menu, num_items_to_order)

        # Create the order
        order_items = [
            {"id": item["id"], "quantity": random.randint(1, 3)}
            for item in items_to_order
        ]

        print("\nCreating an order:")
        order = create_order(chosen_restaurant["id"], order_items)
        if order:
            print(f"Order from {order['restaurant_name']}:")
            for item in order["items"]:
                print(
                    f"- {item['name']}: {item['quantity']} x ${item['price']} = ${item['total']}"
                )
            print(f"Total: ${order['total']:.2f}")

    else:
        print("No restaurants found matching the criteria.")
