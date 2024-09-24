import json
import random
import re

# Load the data (assume it's in a file named 'grocery_data.json')
with open("data/instacart_stores.json", "r") as f:
    data = json.load(f)


def search_stores(query, location):
    """
    Search for stores based on name, tags, or location.

    :param query: String to search for in store name or tags
    :param location: String to search for in store location
    :return: List of matching stores
    """
    results = []
    query = query.lower()
    location = location.lower()

    for store in data:
        store_name = store["name"].lower()
        store_tags = [tag.lower() for tag in store["tags"]]
        store_location = (
            f"{store['location']['city']}, {store['location']['state']}".lower()
        )

        if (
            re.search(query, store_name)
            or any(re.search(query, tag) for tag in store_tags)
            or re.search(location, store_location)
        ):
            results.append(store)

    return results


def get_menu(store_id):
    """
    Get the menu (product list) for a specific store.

    :param store_id: ID of the store
    :return: List of products for the store, or None if store not found
    """
    for store in data:
        if store["id"] == store_id:
            return store["products"]
    return None


def create_order(store_id, items):
    """
    Create an order for a specific store.

    :param store_id: ID of the store
    :param items: List of dictionaries, each containing 'id' and 'quantity'
    :return: Dictionary with order details, or None if store not found
    """
    store = next((s for s in data if s["id"] == store_id), None)
    if not store:
        return None

    order = {"store_name": store["name"], "items": [], "total": 0}

    for item in items:
        product = next((p for p in store["products"] if p["id"] == item["id"]), None)
        if product:
            quantity = item["quantity"]
            item_total = product["price"] * quantity
            order["items"].append(
                {
                    "name": product["name"],
                    "quantity": quantity,
                    "price": product["price"],
                    "total": item_total,
                }
            )
            order["total"] += item_total

    return order


# Example usage:
if __name__ == "__main__":
    # Search for stores
    print("Searching for organic stores in Seattle:")
    results = search_stores("organic", "Seattle")
    for store in results:
        print(f"- {store['name']}")

    if results:
        # Choose the first result to order from
        chosen_store = results[0]
        print(f"\nChosen store: {chosen_store['name']} (ID: {chosen_store['id']})")

        # Get and print all menu items
        print("\nFull menu:")
        menu = get_menu(chosen_store["id"])
        if menu:
            for item in menu:
                print(f"- {item['name']}: ${item['price']} ({item['unit']})")

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
        order = create_order(chosen_store["id"], order_items)
        if order:
            print(f"Order from {order['store_name']}:")
            for item in order["items"]:
                print(
                    f"- {item['name']}: {item['quantity']} x ${item['price']} = ${item['total']}"
                )
            print(f"Total: ${order['total']:.2f}")

    else:
        print("No stores found matching the criteria.")
