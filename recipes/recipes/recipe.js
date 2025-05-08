class AttributeWatcher extends HTMLElement {
    attributeChangedCallback(name, oldValue, newValue) {
        // If the attribute has a corresponding property, update the property
        // Also avoid recursion by checking unuseful attribute changes
        if(oldValue != newValue && this.constructor.observedAttributes?.includes(name)) {
            this[name] = newValue;
        }
    }
}

window.proportionalityFactor = 1;

class RecipeIngredient extends AttributeWatcher {
    static get observedAttributes() {
        return ["name", "quantity", "unit", "index", "factor"];
    }

    constructor() {
        super();

        var ingredientName = document.createElement("span");
        ingredientName.className = "ingredient-name";

        var quantityInput = document.createElement("input");
        quantityInput.type = "number";
        quantityInput.step = 0.01;
        quantityInput.addEventListener("input", () => {
            this.quantity = quantityInput.value;
        });

        var unitSelect = document.createElement("select");
        unitSelect.className = "unit";

        unitSelect.addEventListener("change", () => {
            this.unit = unitSelect.value;
        });

        this.ingredientName = ingredientName;
        this.quantityInput = quantityInput;
        this.unitSelect = unitSelect;
    }

    connectedCallback() {
        this.appendChild(this.ingredientName);
        this.appendChild(this.quantityInput);
        this.appendChild(this.unitSelect);

        document.body.addEventListener("proportion-updated", (e) => this._handleProportionUpdated(e));
    }

    disconnectedCallback() {
        document.body.removeEventListener("proportion-updated", this._handleProportionUpdated);
    }

    _handleProportionUpdated(event) {
        if (event.target !== this) {
            this._inProportionUpdate = true;
            this.quantity = this["initial-quantity"] * window.proportionalityFactor;
            this._inProportionUpdate = false;

            this.unit = adjustUnit(this.quantity, this.getAttribute("unit"));
        }
    }

    get name() {
        return this.getAttribute("name");
    }

    set name(value) {
        this.setAttribute("name", value);
        this.ingredientName.textContent = value;
    }

    get quantity() {
        return parseFloat(this.getAttribute("quantity"));
    }

    set quantity(value) {
        this.setAttribute("quantity", value);
        this.quantityInput.value = +(+value).toFixed(2);

        let proportionalityFactor = this.quantity / this["initial-quantity"];
        if(this._inProportionUpdate || !this["initial-quantity"] || window.proportionalityFactor == proportionalityFactor) return;

        window.proportionalityFactor = proportionalityFactor;

        const event = new CustomEvent("proportion-updated", {
            bubbles: true,
            composed: true
        });

        this.dispatchEvent(event);
    }

    get unit() {
        return this.getAttribute("unit");
    }

    set unit(value) {
        const oldUnit = this.getAttribute("unit");
        if(oldUnit == value) return;
        this.setAttribute("unit", value);
        if(this.unitCategory !== getCategory(value)) {
            this.unitCategory = getCategory(value);
            if(this.unitCategory == "other") {
                this.unitSelect.style.display = "none";
            } else {
                this.unitSelect.style.display = "inline-block";
            }
            while(this.unitSelect.firstChild) {
                this.unitSelect.removeChild(this.unitSelect.firstChild);
            }
            Object.entries(units[getCategory(value)]).forEach(unit => {
                var option = document.createElement("option");
                option.value = unit[0];
                option.textContent = unit[0];
                this.unitSelect.appendChild(option);
            });
        }
        this.unitSelect.value = value;
        if(this["initial-quantity"])
            this["initial-quantity"] = convert(this["initial-quantity"], oldUnit, value);
        if(this.quantity)
            this.quantity = convert(this.quantity, oldUnit, value);
    }

    get "initial-quantity"() {
        return parseFloat(this.getAttribute("initial-quantity"));
    }

    set "initial-quantity"(value) {
        this.setAttribute("initial-quantity", value);
    }
}

customElements.define("recipe-ingredient", RecipeIngredient);

class RecipeDuration extends AttributeWatcher {
    static get observedAttributes() {
        return ["duration"];
    }

    set duration(value) {
        this.setAttribute("duration", value);
        this.textContent = formatDuration(value);
    }
}

customElements.define("recipe-duration", RecipeDuration);

function display404() {
    var recipeTitle = document.querySelector(".recipe-title");
    recipeTitle.textContent = "404 Not Found";
    document.title = "404 Not Found";
}

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const titleToFind = urlParams.get("title");

    if(!titleToFind) return display404();
    const resp = await fetch("recipes.json");
    const data = await resp.json();

    const recipe = data.find(r => r.title === titleToFind);
    if(!recipe) return display404();

    var recipeTitle = document.querySelector(".recipe-title");
    recipeTitle.textContent = recipe.title;
    document.title = recipe.title;

    var recipeIngredients = document.querySelector(".recipe-ingredients");
    var ingredientItem = document.createElement("recipe-ingredient");
    ingredientItem.name = "Facteur de proportionnalité";
    ingredientItem.unit = "";
    ingredientItem.quantity = 1;
    ingredientItem.setAttribute("factor", "");
    ingredientItem["initial-quantity"] = 1;

    var listItem = document.createElement("li");
    listItem.appendChild(ingredientItem);
    recipeIngredients.appendChild(listItem);

    recipe.ingredients.forEach(ingredient => {
        var ingredientItem = document.createElement("recipe-ingredient");
        ingredientItem.name = ingredient.name;
        ingredientItem.unit = ingredient.unit || "";
        ingredientItem.quantity = ingredient.quantity;
        ingredientItem["initial-quantity"] = ingredient.quantity;

        var listItem = document.createElement("li");
        listItem.appendChild(ingredientItem);
        recipeIngredients.appendChild(listItem);
    });

    var recipeSteps = document.querySelector(".recipe-steps");
    recipe.steps.forEach((step, index) => {
        var stepItem = document.createElement("li");
        stepItem.textContent = step;
        recipeSteps.appendChild(stepItem);
    });

    document.getElementById("reset-button").addEventListener("click", () => {
        recipeIngredients.querySelectorAll("recipe-ingredient").forEach(ingredient => {
            // FIXME
            ingredient.updateQuantity(1);
        });
    });
});

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? hours + " hr " : ""}${mins > 0 ? mins + " min" : ""}`;
}

function resetQuantities() {
    window.proportionalityFactor = 1;

    const event = new CustomEvent("proportion-updated", {
        bubbles: true,
        composed: true
    });

    this.dispatchEvent(event);
}

var units = {
    volume: {
        "mL": 0.001,
        "cuillère à café": 0.005,
        "cL": 0.01,
        "cuillère à soupe": 0.015,
        "dL": 0.1,
        "L": 1,
    },
    mass: {
        "mg": 0.001,
        "g": 1,
        "poignée": 30,
        "kg": 1000,
    },
    sachet: {
        sachet: 1,
    },
    other: {
        "": 1,
        null: 1,
        undefined: 1,
    },
};

function getCategory(unit) {
    if(!unit)
        return "other";
    return Object.keys(units).find(category => Object.keys(units[category]).includes(unit)) || "other";
}

function adjustUnit(quantity, unit) {
    // Find the category of the unit
    const category = getCategory(unit);

    // Convert the quantity to the base unit of the category
    const baseQuantity = quantity * units[category][unit];

    // Find the unit that will display the smallest number
    // If the number is not an integer, fall back to the previous unit
    const bestUnits = Object.keys(units[category]).sort((a, b) => {
        const aQuantity = baseQuantity / units[category][a];
        const bQuantity = baseQuantity / units[category][b];

        return aQuantity - bQuantity;
    }).reverse();

    let bestUnit = bestUnits[0];
    for(var unit of bestUnits) {
        if(Number.isInteger(+(baseQuantity / units[category][unit]).toFixed(2))) {
            bestUnit = unit;
        }
    }

    return bestUnit;
}

function convert(quantity, unit, newUnit) {
    if(!quantity) return 0;
    const category = getCategory(unit);
    if(category != "other" && category != getCategory(newUnit))
        throw new Error("Can't convert across different unit categories");
    const baseQuantity = quantity * units[category][unit];
    return baseQuantity / units[category][newUnit];
}
