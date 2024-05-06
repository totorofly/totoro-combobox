import "./style.scss";
import { computePosition, offset, autoUpdate, flip } from "@floating-ui/dom";
import { TotoroComboBox } from "./totoro-combobox";

const selectedItemElement = document.getElementById("selectedItem")!;
const floatElement = document.getElementById("comboboxFloating")!;

let comboBox: TotoroComboBox<{ key: string; value: string }> | undefined;
let selectedKey = "tangerine";

const comboboxUpdatePos = () => {
  computePosition(selectedItemElement, floatElement, {
    placement: "bottom-start",
    middleware: [offset(5), flip()],
  }).then(({ x, y, placement }) => {
    Object.assign(floatElement.style, {
      left: `${x}px`,
      top: `${y}px`,
    });

    if (placement === "bottom-start") {
      floatElement.style.transformOrigin = "top left";
    } else {
      floatElement.style.transformOrigin = "bottom left";
    }
  });
};

autoUpdate(selectedItemElement, floatElement, () => {
  comboboxUpdatePos();
});

selectedItemElement.textContent = selectedKey || "No item selected.";
selectedItemElement.addEventListener("click", () => {
  console.log("selectedItemElement clicked", floatElement.style.display);
  if (floatElement.style.display === "flex") {
    floatElement.style.display = "none";
    comboBox?.destroy();
  } else {
    floatElement.style.display = "flex";
    comboBox = new TotoroComboBox(
      floatElement,
      [
        { key: "1", value: "Apple" },
        { key: "2", value: "Banana" },
        { key: "3", value: "Cherry" },
        { key: "4", value: "Date" },
        { key: "5", value: "Elderberry" },
        { key: "6", value: "Fig" },
        { key: "7", value: "Grape" },
        { key: "8", value: "Honeydew" },
        { key: "9", value: "Kiwi" },
        { key: "10", value: "Lemon" },
        { key: "11", value: "Mango" },
        { key: "12", value: "Nectarine" },
        { key: "13", value: "Orange" },
        { key: "14", value: "Peach" },
        { key: "15", value: "Quince" },
        { key: "16", value: "Raspberry" },
        { key: "17", value: "Strawberry" },
        { key: "tangerine", value: "Tangerine" },
        { key: "19", value: "Ugli fruit" },
        { key: "20", value: "Vanilla bean" },
        { key: "21", value: "Watermelon" },
        { key: "22", value: "Xylocarp" },
        { key: "23", value: "Yuzu" },
        { key: "24", value: "Zucchini" },
      ],
      selectedKey,
      (item) => {
        selectedItemElement.textContent = item.value;
        selectedKey = item.key;
      }
    );
  }
});

document.addEventListener("click", (e: MouseEvent) => {
  const target = e.target as unknown as Node | null;
  if (
    target instanceof Node &&
    !selectedItemElement.contains(target) &&
    !floatElement.contains(target)
  ) {
    floatElement.style.display = "none";
    comboBox?.destroy();
  }
});
