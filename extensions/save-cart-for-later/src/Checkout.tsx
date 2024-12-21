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
  const toggleItem = (item:any) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i:any) => i.id !== item.id) : [...prev, item]
    );
  };

  // פונקציה לשמירת העגלה
  const saveCart = async () => {
    try {
      const response = await fetch("/save-cart", {
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