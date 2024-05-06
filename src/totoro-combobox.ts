export interface ComboBoxItem {
  key: string;
  value: string;
  [propName: string]: any; // Allows adding any other attributes.
}

export class TotoroComboBox<T extends ComboBoxItem> {
  private rootElement: HTMLElement;
  private listBox: HTMLElement;
  private inputBox: HTMLInputElement;
  private items: T[] = [];
  private filteredItems: T[] = [];
  private currentIndex: number = -1;
  private selectedIndex: number = -1; // Add a variable to track the selected index.
  private selectedValue: string = ""; // Add a variable to track the selected value.
  private parentElement: HTMLElement;
  private onComboBoxChange: ((selectedItem: T) => void) | undefined;

  constructor(
    parentElement: HTMLElement,
    items: T[] = [],
    selectedValue?: string,
    onComboBoxChange?: ((selectedItem: T) => void) | undefined
  ) {
    this.onComboBoxChange = onComboBoxChange;
    this.rootElement = this.createRootElement("combo-box");
    this.parentElement = parentElement;
    this.parentElement.appendChild(this.rootElement);
    this.listBox = this.rootElement.querySelector("#list-box")!;
    this.listBox.style.display = "block";

    this.rootElement.setAttribute("aria-owns", this.listBox.id);
    this.rootElement.setAttribute("aria-activedescendant", "");

    this.inputBox = this.rootElement.querySelector(
      "#search-box"
    ) as HTMLInputElement;

    this.items = items;

    this.selectedValue = selectedValue || ""; // Set initial selected value.
    this.setselectedValueItem(this.selectedValue); // Set initial selected item.
    this.handleKeyboard = this.handleKeyboard.bind(this);
    this.selectItem = this.selectItem.bind(this);
    this.filterItems = this.filterItems.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.attachEvents();
    this.updateListBox(true); // Modify here to display all items at initialization.

    this.inputBox.focus({
      preventScroll: true, // Use the preventScroll option to prevent scrolling.
    });
  }

  private createRootElement(id: string): HTMLElement {
    const container = document.createElement("div");
    container.id = id;
    container.setAttribute("role", "combobox");
    container.setAttribute("aria-expanded", "false");
    container.setAttribute("aria-haspopup", "listbox");

    const input = document.createElement("input");
    input.type = "text";
    input.id = "search-box";
    input.setAttribute("aria-controls", "list-box");
    input.placeholder = "Search...";
    container.appendChild(input);

    const listBox = document.createElement("div");
    listBox.id = "list-box";
    listBox.setAttribute("role", "listbox");
    listBox.tabIndex = -1;
    listBox.style.display = "none"; // List box is hidden by default.
    container.appendChild(listBox);

    return container;
  }

  private setselectedValueItem(selectedValue?: string): void {
    if (selectedValue) {
      const index = this.items.findIndex((item) => item.key === selectedValue);

      if (index !== -1) {
        this.selectedIndex = index;

        // Ensure execution after DOM has been fully rendered.
        setTimeout(() => {
          requestAnimationFrame(() => {
            const selectedItem = this.listBox.querySelector(
              "div.selected"
            ) as HTMLElement;
            if (selectedItem) {
              // selectedItem.scrollIntoView({ block: "center" });
              this.scrollToViewIfNeeded(selectedItem, this.listBox);
            }
          });
        }, 100);
      }
    }
  }

  private scrollToViewIfNeeded(element: HTMLElement, parent: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    if (rect.bottom > parentRect.bottom) {
      parent.scrollTop += rect.bottom - parentRect.bottom + 50;
    } else if (rect.top < parentRect.top) {
      parent.scrollTop += rect.top - parentRect.top;
    }
  }

  private attachEvents(): void {
    this.inputBox.addEventListener("focus", this.handleFocus);
    this.inputBox.addEventListener("input", this.filterItems);
    this.listBox.addEventListener("mousedown", this.selectItem);
    this.rootElement.addEventListener("keydown", this.handleKeyboard);
  }

  private detachEvents(): void {
    this.inputBox.removeEventListener("focus", this.handleFocus);
    this.inputBox.removeEventListener("input", this.filterItems);
    this.listBox.removeEventListener("mousedown", this.selectItem);
    this.rootElement.removeEventListener("keydown", this.handleKeyboard);
  }

  public destroy(): void {
    this.detachEvents();
    this.rootElement.remove(); // Optionally remove the root element from DOM
  }

  private handleFocus = () => {
    this.rootElement.setAttribute("aria-expanded", "true"); // No voice output, there is an issue that needs optimization. #TODO
    if (this.currentIndex === -1 && this.filteredItems.length > 0) {
      this.currentIndex = 0;
      this.highlightItem(this.currentIndex);
    }
  };

  private filterItems(): void {
    const searchText = this.inputBox.value.toLowerCase();
    this.filteredItems = this.items.filter((item) =>
      item.value.toLowerCase().includes(searchText)
    );

    // Use selectedValue to update selectedIndex.
    if (this.selectedValue) {
      this.selectedIndex = this.filteredItems.findIndex(
        (item) => item.key === this.selectedValue
      );
    } else {
      this.selectedIndex = -1; // No item is selected.
    }

    this.currentIndex = this.filteredItems.length > 0 ? 0 : -1;

    this.updateListBox(false);
  }

  private updateListBox(showAll: boolean): void {
    this.listBox.innerHTML = "";
    const itemsToShow = showAll ? this.items : this.filteredItems;
    itemsToShow.forEach((item, index) => {
      const listItem = document.createElement("div");
      listItem.textContent = item.value;
      listItem.tabIndex = -1;
      listItem.role = "option";
      listItem.id = "option-" + index;

      listItem.setAttribute("aria-selected", "false");

      if (index === this.selectedIndex) {
        listItem.classList.add("selected");
        listItem.setAttribute("aria-selected", "true");
      }
      listItem.addEventListener("mousemove", () => this.highlightItem(index));
      listItem.addEventListener("mouseleave", () =>
        this.unhighlightItem(index)
      );
      this.listBox.appendChild(listItem);
    });
  }

  private selectItem(event: Event): void {
    const target = event.target as HTMLElement;
    // Ensure the event target is a div and acts as an option.
    if (target.role === "option") {
      const targetIndex = Array.from(this.listBox.children).indexOf(target);
      const itemData = this.inputBox.value
        ? this.filteredItems[targetIndex]
        : this.items[targetIndex];

      if (itemData) {
        this.selectedIndex = targetIndex;
        this.onComboBoxChange?.(itemData);
      }
      this.inputBox.value = ""; // Clear the input field.
      this.filterItems(); // Update the list box.
      this.rootElement.setAttribute("aria-expanded", "false"); // Close the list box.
      this.parentElement.style.display = "none"; // Hide the parent element
      this.destroy(); // Destroy the component
    }
  }

  private highlightItem(index: number): void {
    this.clearHighlights();
    const listItem = this.listBox.querySelector(
      `#option-${index}`
    ) as HTMLElement;
    listItem.classList.add("highlighted");
    this.rootElement.setAttribute("aria-activedescendant", listItem.id);
    this.currentIndex = index;
  }

  private unhighlightItem(index: number): void {
    const listItem = this.listBox.querySelector(
      `#option-${index}`
    ) as HTMLElement;
    listItem.classList.remove("highlighted");
    if (this.currentIndex === index) {
      this.rootElement.setAttribute("aria-activedescendant", "");
    }
  }

  private resetCurrentIndexToFirstVisible(): void {
    const listItems = Array.from(this.listBox.children) as HTMLElement[];
    const listBoxRect = this.listBox.getBoundingClientRect();
    for (let i = 0; i < listItems.length; i++) {
      const itemRect = listItems[i].getBoundingClientRect();
      if (
        itemRect.bottom > listBoxRect.top &&
        itemRect.bottom <= listBoxRect.bottom
      ) {
        this.currentIndex = i;
        break;
      }
    }
  }

  private clearHighlights(): void {
    this.listBox
      .querySelectorAll("div.highlighted")
      .forEach((item) => item.classList.remove("highlighted"));
  }

  private handleKeyboard(event: KeyboardEvent): void {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const highlightedExists =
        this.listBox.querySelector("div.highlighted") !== null;
      const itemList = this.inputBox.value ? this.filteredItems : this.items; // Choose the current list to iterate through.
      event.preventDefault();

      let newCurrentIndex = 0;

      if (!highlightedExists) {
        this.resetCurrentIndexToFirstVisible();
        newCurrentIndex = this.currentIndex;
      } else {
        newCurrentIndex =
          this.currentIndex + (event.key === "ArrowDown" ? 1 : -1);
      }

      // Limit newCurrentIndex within a valid range.
      if (newCurrentIndex >= itemList.length) {
        newCurrentIndex = itemList.length - 1;
      } else if (newCurrentIndex < 0) {
        newCurrentIndex = 0;
      }

      this.currentIndex = newCurrentIndex;
      this.highlightItem(this.currentIndex);
      const highlightItem = this.listBox.querySelector(
        `#option-${this.currentIndex}`
      ) as HTMLElement;
      highlightItem.scrollIntoView({ block: "nearest" });
      //   this.scrollToViewIfNeeded(highlightItem, this.listBox);
    } else if (event.key === "Enter" && this.currentIndex !== -1) {
      const highlightItem = this.listBox.querySelector(
        `#option-${this.currentIndex}`
      ) as HTMLElement;
      if (highlightItem) {
        this.selectItem({ target: highlightItem } as unknown as Event);
      }
    }
  }
}
