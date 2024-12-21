import {
  reactExtension,
  useApi,
  BlockStack,
  Text,
  Checkbox,
  Button,
} from "@shopify/ui-extensions-react/checkout";

import { useState } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));


function Extension() {
  const { lines } = useApi(); // גישה לנתוני ה-checkout
  const [selectedItems, setSelectedItems] = useState<string[]>([]); // שמירת פריטים נבחרים

  // פונקציה להוספה/הסרה של פריטים מתוך רשימת הפריטים שנבחרו
  const toggleItem = (item: any) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i: any) => i.id !== item.id) : [...prev, item]
    );
  };

  // פונקציה לשמירת העגלה
  const saveCart = async () => {
    try {
      const response = await fetch("/api/save-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: 1, items: selectedItems }),
      });

      if (response.ok) {
        alert("Cart saved successfully!");
      } else {
        alert("Failed to save the cart.");
      }
    } catch (error) {
      console.log(error);
    }
  };

  async function fetchSavedCart(userId) {
    try {
      const response = await fetch(`/api/get-saved-cart/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch saved cart');
      }

      const data = await response.json();
      return data.savedCart; // רשימת הפריטים השמורים
    } catch (error) {
      console.error('Error fetching saved cart:', error);
      return [];
    }
  }

  async function restoreCart(userId) {
    const savedCart = await fetchSavedCart(userId);

    const validItems = savedCart.filter((item) => item.id && item.quantity > 0);
    if (validItems.length === 0) {
      console.log('No valid items to restore.');
      return;
    }

    // הוספת הפריטים לסל הקניות של Shopify
    const cartResponse = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: savedCart.map(item => ({
          id: item.id, // מזהה המוצר
          quantity: item.quantity, // כמות המוצר
        })),
      }),
    });

    if (cartResponse.ok) {
      console.log('Cart restored successfully!');
    } else {
      console.error('Error restoring cart:', await cartResponse.text());
    }
  }


  // אם אין פריטים בעגלה
  if (!lines.current || lines.current.length === 0) {
    return <Text>No items in cart to save!</Text>;
  }

  return (
    <BlockStack>
      <Text>Choose items to save for later:</Text>
      {lines.current.map((item) => (
        <Checkbox
          key={item.id}
          checked={selectedItems.includes(item.id)}
          onChange={() => toggleItem(item)}
        >
          {item.merchandise.title}
        </Checkbox>
      ))}
      <Button disabled={!!!selectedItems.length} onPress={saveCart}>Save Cart</Button>
    </BlockStack>
  );
}