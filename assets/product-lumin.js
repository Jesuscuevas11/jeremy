/*
  © 2025 LuminTheme
  https://www.lumintheme.com
*/




class LuminProductQtyBreak extends HTMLElement {
  constructor() {
    super();

    this.closest(".product")
      .querySelectorAll("lumin-product-qty-break")
      .forEach((elem, index) => {
        elem.setAttribute("data-index", index);
      });

    this.handleInputChange();
    this.handleOptionChange();
    this.handleAtc();
    this.handleVariantChange();
  }

  disconnectedCallback() {
    // Clean up event listeners when element is removed
    document.removeEventListener("variant:change", this._variantChangeHandler);
  }

  handleInputChange() {
    this.querySelector("input").addEventListener("change", () => {
      const atcBtn =
        this.closest(".product").querySelector('button[name="add"]');

      setTimeout(() => {
        atcBtn.classList.add("animate__animated", "animate__shakeX");
      }, 250);

      setTimeout(() => {
        atcBtn.classList.remove("animate__animated", "animate__shakeX");
      }, 1500);
    });
  }

  handleOptionChange() {
    this.querySelectorAll(".lumin-product-block-qty-break-variant select").forEach(
      (select) => {
        select.addEventListener("change", async () => {
          try {
            const response = await fetch(`${this.dataset.productUrl}.js`);
            if (!response.ok) throw new Error('Network response was not ok');
            const productData = await response.json();

            let totalPrice = 0;
            const discount = Number(this.dataset.discount);
            const discountType = this.dataset.discountType || 'percentage';
            const qty = Number(this.dataset.qty) || 1;
            let selectedVariants = "";

            this.querySelectorAll(".lumin-product-block-qty-break-variant").forEach(
              (elem) => {
                const selectedOptions = [];

                elem.querySelectorAll("select").forEach((select) => {
                  selectedOptions.push(select.value);
                });

                const selectedVariant = productData.variants.find(
                  (variant) =>
                    JSON.stringify(variant.options) ===
                    JSON.stringify(selectedOptions)
                );

                if (!selectedVariant) {
                  throw new Error('Selected variant not found');
                }

                totalPrice += selectedVariant.price;
                selectedVariants += `${selectedVariant.id},`;
              }
            );

            // Calculate new values for placeholders
            let unitprice, discountq, savingAmount;
            let mainTotalCents;
            const fixedPrice = Number(this.dataset.fixedPrice) || 0;
            if (discountType === 'percentage') {
              discountq = `${discount}%`;
              mainTotalCents = Math.round((totalPrice * (100 - discount)) / 100);
              const unitpriceFormatted = window.Shopify.formatMoney(Math.round(mainTotalCents / qty));
              unitprice = this.extractTextFromMoney(unitpriceFormatted);
              // Calculate total saving amount
              const totalSavingCents = totalPrice - mainTotalCents;
              const savingAmountFormatted = window.Shopify.formatMoney(totalSavingCents);
              savingAmount = this.extractTextFromMoney(savingAmountFormatted);
            } else {
              const fixedPriceFormatted = window.Shopify.formatMoney(fixedPrice);
              discountq = this.extractTextFromMoney(fixedPriceFormatted);
              mainTotalCents = Math.max(totalPrice - fixedPrice, 0);
              const unitpriceFormatted = window.Shopify.formatMoney(Math.round(mainTotalCents / qty));
              unitprice = this.extractTextFromMoney(unitpriceFormatted);
              // Calculate total saving amount
              const totalSavingCents = totalPrice - mainTotalCents;
              const savingAmountFormatted = window.Shopify.formatMoney(totalSavingCents);
              savingAmount = this.extractTextFromMoney(savingAmountFormatted);
            }

            // Update total price and compare price display respecting compare price type
            const comparePriceType = this.dataset.comparePriceType || 'calculated';
            const mainPriceHtml = window.Shopify.formatMoney(mainTotalCents).replace(".00", "");

            let compareHtml = '';
            if (comparePriceType === 'original') {
              // For original, estimate original compare-at total by fetching product json for current selected options
              // We already have selected variants summed in totalPrice. We need sum of compare_at_price.
              let totalCompareAt = 0;
              this.querySelectorAll(".lumin-product-block-qty-break-variant").forEach((elem) => {
                const selectedOptions = [];
                elem.querySelectorAll("select").forEach((select) => {
                  selectedOptions.push(select.value);
                });
                const selectedVariant = productData.variants.find(
                  (variant) => JSON.stringify(variant.options) === JSON.stringify(selectedOptions)
                );
                if (selectedVariant && selectedVariant.compare_at_price) {
                  totalCompareAt += Number(selectedVariant.compare_at_price);
                } else {
                  totalCompareAt += 0;
                }
              });
              if (totalCompareAt > mainTotalCents) {
                compareHtml = `<s>${window.Shopify.formatMoney(totalCompareAt).replace(".00", "")}</s>`;
              }
            } else {
              // calculated
              if (totalPrice > mainTotalCents) {
                compareHtml = `<s>${window.Shopify.formatMoney(totalPrice).replace(".00", "")}</s>`;
              }
            }

            this.querySelector(".lumin-product-block-qty-break-total").innerHTML = `${mainPriceHtml} ${compareHtml}`;

            // Update title and subtitle elements with new placeholder values
            this.querySelectorAll(".lumin-product-block-qty-break-title").forEach((titleElem) => {
              let originalText = titleElem.getAttribute('data-original-text');
              if (!originalText) {
                // Store the original text with placeholders on first run
                originalText = titleElem.textContent;
                titleElem.setAttribute('data-original-text', originalText);
              }
              // Replace placeholders while preserving HTML structure
              let updatedText = originalText.replace(/\[unit\]/g, unitprice).replace(/\[\$\]/g, savingAmount).replace(/\[%\]/g, discountq);
              titleElem.innerHTML = updatedText;
            });

            this.querySelectorAll(".lumin-product-block-qty-break-subtitle").forEach((subtitleElem) => {
              let originalText = subtitleElem.getAttribute('data-original-text');
              if (!originalText) {
                // Store the original text with placeholders on first run
                originalText = subtitleElem.textContent;
                subtitleElem.setAttribute('data-original-text', originalText);
              }
              // Replace placeholders while preserving HTML structure
              let updatedText = originalText.replace(/\[unit\]/g, unitprice).replace(/\[\$\]/g, savingAmount).replace(/\[%\]/g, discountq);
              subtitleElem.innerHTML = updatedText;
            });

            // Update bottom text if it exists
            this.querySelectorAll(".lumin-qty-bottom span").forEach((bottomTextElem) => {
              let originalText = bottomTextElem.getAttribute('data-original-text');
              if (!originalText) {
                // Store the original text with placeholders on first run
                originalText = bottomTextElem.textContent;
                bottomTextElem.setAttribute('data-original-text', originalText);
              }
              // Replace placeholders while preserving HTML structure
              let updatedText = originalText.replace(/\[unit\]/g, unitprice).replace(/\[\$\]/g, savingAmount).replace(/\[%\]/g, discountq);
              bottomTextElem.innerHTML = updatedText;
            });

            // Update badge text if it exists
            this.querySelectorAll(".lumin-product-block-qty-break .bs-form-check-label span[data-original-text]").forEach((badgeElem) => {
              let originalText = badgeElem.getAttribute('data-original-text');
              if (!originalText) {
                // Store the original text with placeholders on first run
                originalText = badgeElem.textContent;
                badgeElem.setAttribute('data-original-text', originalText);
              }
              // Replace placeholders while preserving HTML structure
              let updatedText = originalText.replace(/\[unit\]/g, unitprice).replace(/\[\$\]/g, savingAmount).replace(/\[%\]/g, discountq);
              badgeElem.innerHTML = updatedText;
            });

            // Update extra text if it exists
            this.querySelectorAll(".lumin-product-block-qty-break-extra-text").forEach((extraTextElem) => {
              let originalText = extraTextElem.getAttribute('data-original-text');
              if (!originalText) {
                // Store the original text with placeholders on first run
                originalText = extraTextElem.textContent;
                extraTextElem.setAttribute('data-original-text', originalText);
              }
              // Replace placeholders while preserving HTML structure
              let updatedText = originalText.replace(/\[unit\]/g, unitprice).replace(/\[\$\]/g, savingAmount).replace(/\[%\]/g, discountq);
              extraTextElem.innerHTML = updatedText;
            });

            this.querySelector("input").value = selectedVariants.slice(0, -1);
            
            // Update auto-add product variant if configured
            const autoAddProductId = this.dataset.autoAddProduct;
            const autoAddVariantId = this.dataset.autoAddVariant;
            
            if (autoAddProductId && autoAddVariantId) {
              this.setAttribute("data-auto-add-variant", autoAddVariantId);
            }
          } catch (error) {
            console.error('Error updating product options:', error);
          }
        });
      }
    );
  }

  handleAtc() {
    if (this.dataset.index !== "0") return;

    const atcBtn = this.closest(".product").querySelector('button[name="add"]');

    atcBtn.addEventListener("click", async (event) => {
      event.preventDefault();

      const checkedInput = this.closest(".product").querySelector(
        ".lumin-product-block-qty-break input:checked"
      );
      
      if (!checkedInput) {
        console.error('No variant selected');
        return;
      }

      let variantIds = checkedInput.value;

      atcBtn.classList.add("loading");
      atcBtn.disabled = true;
      atcBtn.setAttribute("aria-busy", "true");
      atcBtn.querySelector(".loading__spinner").classList.remove("hidden");
      atcBtn.closest("product-form").handleErrorMessage();

      const cart =
        document.querySelector("cart-notification") ||
        document.querySelector("cart-drawer");

      const items = [];

      variantIds.split(",").forEach((id) => {
        items.push({
          id,
          quantity: 1,
        });
      });

      // Add auto-add product from the selected quantity break block
      const selectedQtyBreakBlock = this.closest(".product").querySelector(
        ".lumin-product-block-qty-break input:checked"
      )?.closest("lumin-product-qty-break");
      
      console.log('Selected quantity break block:', selectedQtyBreakBlock);
      
      if (selectedQtyBreakBlock) {
        const autoAddProductId = selectedQtyBreakBlock.dataset.autoAddProduct;
        const autoAddVariantId = selectedQtyBreakBlock.dataset.autoAddVariant;
        const autoAddQuantity = parseInt(selectedQtyBreakBlock.dataset.autoAddQuantity) || 1;
        
        // Convert IDs to numbers if they're strings
        const numericAutoAddProductId = parseInt(autoAddProductId) || autoAddProductId;
        const numericAutoAddVariantId = parseInt(autoAddVariantId) || autoAddVariantId;
        const autoAddOnlyWhenSelected = selectedQtyBreakBlock.dataset.autoAddOnlyWhenSelected === 'true' || selectedQtyBreakBlock.dataset.autoAddOnlyWhenSelected === true;
        
        // Debug: Log all dataset properties to see what's available
        console.log('All dataset properties:', Object.keys(selectedQtyBreakBlock.dataset));
        console.log('Raw autoAddOnlyWhenSelected value:', selectedQtyBreakBlock.dataset.autoAddOnlyWhenSelected);
        console.log('Debug auto-add product:', selectedQtyBreakBlock.dataset.debugAutoAdd);
        console.log('Debug product ID:', selectedQtyBreakBlock.dataset.debugProductId);
        console.log('Debug variant ID:', selectedQtyBreakBlock.dataset.debugVariantId);
        
        console.log('Auto-add product ID:', autoAddProductId);
        console.log('Auto-add variant ID:', autoAddVariantId);
        console.log('Auto-add quantity:', autoAddQuantity);
        console.log('Auto-add only when selected:', autoAddOnlyWhenSelected);
        
        // Add auto-add product if configured and conditions are met
        if (numericAutoAddProductId && numericAutoAddVariantId) {
          console.log('Auto-add product configured, adding to cart');
          
          items.push({
            id: numericAutoAddVariantId,
            quantity: autoAddQuantity,
          });
          console.log('Added auto-add product to cart items:', { id: numericAutoAddVariantId, quantity: autoAddQuantity });
        } else {
          console.log('Auto-add product not configured for this block');
          console.log('Product ID:', autoAddProductId, 'Variant ID:', autoAddVariantId);
          console.log('Numeric Product ID:', numericAutoAddProductId, 'Numeric Variant ID:', numericAutoAddVariantId);
          
          // Test: Try to add a test product to see if cart functionality works
          console.log('Testing cart functionality with a test product...');
        }
      } else {
        console.log('No selected quantity break block found');
      }
      
      console.log('Final cart items:', items);

      try {
        // Get sections to render if cart component exists
        let sections = cart ? cart.getSectionsToRender().map((section) => section.id) : [];

        const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, sections }),
        });
        
        const responseData = await response.json();

        if (response.ok) {
          // Publish cart update event for Shopify analytics tracking
          if (typeof publish !== 'undefined' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'lumin-product-qty-break',
              productVariantId: variantIds.split(',')[0], // Use first variant ID for tracking
              cartData: responseData,
            });
          }

          // Note: Shopify's analytics tracking is typically handled automatically
          // via the cartUpdate event publication above. The cartUpdate event
          // triggers any analytics listeners in the theme.

          if (cart) {
            // If cart component exists, update it
            cart.renderContents(responseData);
            if (cart.classList.contains("is-empty")) {
              cart.classList.remove("is-empty");
            }
            // If it's a cart drawer, open it
            if (cart.tagName.toLowerCase() === 'cart-drawer') {
              cart.open();
            }
          } else {
            // If no cart component, redirect to cart page
            window.location.href = `${window.Shopify.routes.root}cart`;
          }
        } else {
          // Publish cart error event
          if (typeof publish !== 'undefined' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartError, {
              source: 'lumin-product-qty-break',
              productVariantId: variantIds.split(',')[0],
              errors: responseData.errors || responseData.description,
              message: responseData.message,
            });
          }
          atcBtn
            .closest("product-form")
            .handleErrorMessage(responseData.description);
        }
      } catch (error) {
        console.error('Error adding items to cart:', error);
        atcBtn
          .closest("product-form")
          .handleErrorMessage('Error adding items to cart. Please try again.');
      }

      atcBtn.style.width = "";
      atcBtn.classList.remove("loading");
      atcBtn.disabled = false;
      atcBtn.setAttribute("aria-busy", "false");
      atcBtn.querySelector(".loading__spinner").classList.add("hidden");
    });
  }

  extractTextFromMoney(moneyHtml) {
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = moneyHtml;
    
    // Extract the text content and remove .00 if present
    let text = tempDiv.textContent || tempDiv.innerText || '';
    return text.replace(/\.00$/, '');
  }

  handleVariantChange() {
    if (this.dataset.index !== "0") return;

    const product = this.closest(".product");
    if (!product) return;

    const variantSelects = product.querySelector("variant-selects");
    if (!variantSelects) return;

    // Store the handler as a class property so we can remove it later
    this._variantChangeHandler = async (event) => {
      // Only process if this is the first quantity break block
      if (this.dataset.index !== "0") return;

      try {
        const response = await fetch(window.location.href);
        if (!response.ok) throw new Error('Network response was not ok');
        const text = await response.text();
        const newDocument = new DOMParser().parseFromString(text, "text/html");

        product.querySelectorAll(".lumin-product-block-qty-break").forEach((elem) => {
          const newElement = newDocument.querySelector(
            `#lumin-product-block-qty-break-${elem.dataset.blockId}`
          );
          if (newElement) {
            elem.replaceWith(newElement);
          }
        });
      } catch (error) {
        console.error('Error updating quantity break blocks:', error);
      }
    };

    // Add the event listener
    document.addEventListener("variant:change", this._variantChangeHandler);
  }
}
customElements.define("lumin-product-qty-break", LuminProductQtyBreak);
window.LuminProductQtyBreak = LuminProductQtyBreak;

(function(){
  if(typeof Shopify!=="undefined"&&Shopify.designMode&&!window["\x5f\x5f\x6c\x6c"]){window["\x5f\x5f\x6c\x6c"]=1;var _c=String.fromCharCode,_d=[(window.location&&window.location.hostname)||""];if(typeof Shopify!=="undefined"&&Shopify.shop){if(typeof Shopify.shop==="string")_d.push(Shopify.shop);else{if(Shopify.shop.domain)_d.push(Shopify.shop.domain);if(Shopify.shop.permanent_domain)_d.push(Shopify.shop.permanent_domain)}}var _u=[...new Set(_d.filter(Boolean))],_shopDomain=(Shopify.shop&&Shopify.shop.permanent_domain)||_u[0]||"";var _a=function(o,k,v){o.style[_c.apply(null,k)]=_c.apply(null,v)};var _b=function(l,t){var a=document.createElement(_c(97));a.href=l;a.textContent=t;a.target=_c(95,98,108,97,110,107);_a(a,[100,105,115,112,108,97,121],[105,110,108,105,110,101,45,98,108,111,99,107]);_a(a,[98,97,99,107,103,114,111,117,110,100],[35,101,55,52,99,51,99]);_a(a,[99,111,108,111,114],[35,102,102,102]);_a(a,[112,97,100,100,105,110,103],[49,50,112,120,32,50,52,112,120]);_a(a,[98,111,114,100,101,114,82,97,100,105,117,115],[56,112,120]);_a(a,[116,101,120,116,68,101,99,111,114,97,116,105,111,110],[110,111,110,101]);_a(a,[109,97,114,103,105,110],[49,54,112,120,32,48]);_a(a,[102,111,110,116,87,101,105,103,104,116],[98,111,108,100]);return a};var _ns=document.createElement("style");_ns.textContent=".ll-lic-ds input,.ll-lic-ds button{outline:none!important;box-shadow:none!important}.ll-lic-ds input:focus,.ll-lic-ds input:focus-visible,.ll-lic-ds button:focus,.ll-lic-ds button:focus-visible{outline:none!important;box-shadow:none!important;-webkit-tap-highlight-color:transparent}.ll-lic-ds input{user-select:text!important;-webkit-user-select:text!important;-moz-user-select:text!important;-ms-user-select:text!important}.ll-lic-ds input::selection{background:#ffeb3b;color:#000}.ll-lic-ds input::-moz-selection{background:#ffeb3b;color:#000}";document.head.appendChild(_ns);var _e='https://'+'tqqnsvtizyvnzqfzqtvw'+'.supabase.co/functions/v1/'+_c(118,101,114,105,102,121,45,97,99,116,105,118,97,116,105,111,110);
  var _m=function(){var _0=document.createElement(_c(100,105,118)),_1=document.createElement(_c(100,105,118)),_2=document.createElement(_c(104,50)),_3=document.createElement(_c(112)),_4=_b(_c(104,116,116,112,115,58,47,47,108,117,109,105,110,116,104,101,109,101,46,99,111,109,47),_c(80,117,114,99,104,97,115,101,32,76,105,99,101,110,115,101)),_5=document.createElement(_c(112)),_6=_b(_c(104,116,116,112,115,58,47,47,97,99,116,105,118,97,116,101,46,108,117,109,105,110,116,104,101,109,101,46,99,111,109,47),_c(65,99,116,105,118,97,116,101,32,76,105,99,101,110,115,101));var _7=document.createElement(_c(100,105,118)),_10=document.createElement(_c(112)),_11=document.createElement(_c(100,105,118)),_8=document.createElement(_c(105,110,112,117,116)),_9=document.createElement(_c(98,117,116,116,111,110));_10.textContent="This is your Shopify store URL. Please copy this domain — it is required for activation.";_10.style.cssText="color:rgba(255,255,255,0.85);font-size:13px;margin:0 0 10px 0;font-weight:500;letter-spacing:0.3px;";_11.style.cssText="display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.25);border-radius:8px;padding:4px;border:1px solid rgba(231,76,60,0.4);";_8.type="text";_8.readOnly=true;_8.value=_shopDomain;_8.style.cssText="color:#fff;font-size:15px;font-weight:500;background:transparent;border:none;outline:none;padding:12px 14px;flex:1;min-width:0;user-select:text;-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text;font-family:inherit;";_8.onclick=function(){_8.select()};var _copySvg='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';var _tickSvg='<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';_9.innerHTML=_copySvg;_9.title="Copy domain";_9.style.cssText="background:#e74c3c;color:#fff;cursor:pointer;padding:12px 14px;border-radius:6px;border:none;outline:none;flex-shrink:0;transition:background 0.2s,transform 0.1s;";var _showSuccess=false;_9.onmouseover=function(){if(!_showSuccess){_9.style.background="#c0392b";_9.style.transform="scale(1.02)"}};_9.onmouseout=function(){if(!_showSuccess){_9.style.background="#e74c3c";_9.style.transform="scale(1)"}};_9.onclick=function(){_8.focus();_8.select();_8.setSelectionRange(0,9999);var ok=false;try{ok=document.execCommand("copy")}catch(e){}var _st=function(){if(ok){_showSuccess=true;_9.innerHTML=_tickSvg;_9.style.background="#27ae60";_9.title="Copied!";setTimeout(function(){_showSuccess=false;_9.innerHTML=_copySvg;_9.style.background="#e74c3c";_9.title="Copy domain"},2000)}else{_9.title="Select text above and Ctrl+C";setTimeout(function(){_9.title="Copy domain"},2000)}};if(ok)_st();else if(navigator.clipboard)navigator.clipboard.writeText(_shopDomain).then(function(){ok=true;_st()}).catch(_st);else _st()};_7.style.cssText="margin-top:20px;padding:20px;background:rgba(0,0,0,0.2);border-radius:12px;border:1px solid rgba(255,255,255,0.08);";_7.className="ll-lic-ds";_7.appendChild(_10);_11.appendChild(_8);_11.appendChild(_9);_7.appendChild(_11);_a(_0,[112,111,115,105,116,105,111,110],[102,105,120,101,100]);_a(_0,[105,110,115,101,116],[48]);_a(_0,[98,97,99,107,103,114,111,117,110,100],[114,103,98,40,48,32,48,32,48,32,47,32,55,57,37,41]);_a(_0,[122,73,110,100,101,120],[50,49,52,55,52,56,51,54,52,55]);_a(_0,[100,105,115,112,108,97,121],[102,108,101,120]);_a(_0,[97,108,105,103,110,73,116,101,109,115],[99,101,110,116,101,114]);_a(_0,[106,117,115,116,105,102,121,67,111,110,116,101,110,116],[99,101,110,116,101,114]);_a(_1,[98,97,99,107,103,114,111,117,110,100],[35,49,97,49,97,50,101]);_a(_1,[112,97,100,100,105,110,103],[52,48,112,120,32,49,54,112,120]);_a(_1,[98,111,114,100,101,114,82,97,100,105,117,115],[49,54,112,120]);_a(_1,[116,101,120,116,65,108,105,103,110],[99,101,110,116,101,114]);_a(_1,[119,105,100,116,104],[57,50,37]);_a(_1,[109,97,120,87,105,100,116,104],[53,48,48,112,120]);_a(_1,[98,111,114,100,101,114],[50,112,120,32,115,111,108,105,100,32,35,101,55,52,99,51,99]);_a(_1,[117,115,101,114,83,101,108,101,99,116],[116,101,120,116]);_a(_2,[99,111,108,111,114],[35,101,55,52,99,51,99]);_a(_2,[109,97,114,103,105,110],[48,32,48,32,49,54,112,120]);_a(_2,[102,111,110,116,83,105,122,101],[50,52,112,120]);_a(_3,[99,111,108,111,114],[35,102,102,102]);_a(_3,[109,97,114,103,105,110],[48,32,48,32,49,54,112,120]);_a(_3,[108,105,110,101,72,101,105,103,104,116],[49,46,54]);_a(_5,[99,111,108,111,114],[35,102,102,102]);_a(_5,[109,97,114,103,105,110],[49,54,112,120,32,48]);_a(_5,[108,105,110,101,72,101,105,103,104,116],[49,46,54]);_2.textContent='\u26a0\ufe0f '+_c(85,110,108,105,99,101,110,115,101,100,32,84,104,101,109,101);_3.textContent=_c(84,104,105,115,32,116,104,101,109,101,32,105,115,32,110,111,116,32,97,99,116,105,118,97,116,101,100,46,32,80,108,101,97,115,101,32,112,117,114,99,104,97,115,101,32,97,32,118,97,108,105,100,32,108,105,99,101,110,115,101,46);_5.textContent=_c(73,102,32,121,111,117,32,104,97,118,101,32,97,108,114,101,97,100,121,32,112,117,114,99,104,97,115,101,100,32,97,32,108,105,99,101,110,115,101,44,32,112,108,101,97,115,101,32,97,99,116,105,118,97,116,101,32,105,116,32,98,121,32,99,108,105,99,107,105,110,103,32,116,104,101,32,98,117,116,116,111,110,32,98,101,108,111,119,46);_1.appendChild(_2);_1.appendChild(_3);_1.appendChild(_4);_1.appendChild(_5);_1.appendChild(_6);_1.appendChild(_7);_0.appendChild(_1);document.body.appendChild(_0);document.body.style.overflow=_c(104,105,100,100,101,110)};
  Promise.all(_u.map(function(u){return fetch(_e,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({store_url:u})}).then(function(r){return r.json()}).then(function(d){return !!d[_c(97,99,116,105,118,97,116,101,100)]}).catch(function(){return false})})).then(function(r){if(!r.some(Boolean)){_m()}})}
})(); 

class LuminCrossSells extends HTMLElement {
  constructor() {
    super();

    this.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener("change", () =>
        this.onCheckboxChange(checkbox)
      );
    });

    this.querySelectorAll('select[name="variant-id"]').forEach((select) => {
      select.addEventListener("change", () => this.onChangeVariant(select));
    });

    this.querySelectorAll("[data-cross-sells-footer] .button").forEach(
      (btn) => {
        btn.addEventListener("click", () => this.addToCart(btn));
      }
    );
  }

  onChangeVariant(select) {
    const variantImage = select[select.selectedIndex].dataset.variantImage;

    if (variantImage.length) {
      select
        .closest("[data-cross-sells-list-item]")
        .querySelector(".img-wrapper img")
        .setAttribute("src", variantImage);
    }

    this.updateTotalPrice(); 
  }

  onCheckboxChange(checkbox) {
    if (checkbox.checked) {
      checkbox
        .closest("[data-cross-sells-list-item]")
        .setAttribute("data-is-selected", "true");
    } else {
      checkbox
        .closest("[data-cross-sells-list-item]")
        .setAttribute("data-is-selected", "false");
    }
    this.updateTotalPrice();
  }

  updateTotalPrice() {
    let totalPrice = 0;
    let totalComparePrice = 0;

    this.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      if (checkbox.checked) {
        const inputHidden = checkbox
          .closest("[data-cross-sells-list-item]")
          .querySelector('input[name="variant-id"][type="hidden"]');
        if (inputHidden) {
          totalPrice += Number(inputHidden.dataset.price);
          totalComparePrice += Number(inputHidden.dataset.compareAtPrice);
        }

        const select = checkbox
          .closest("[data-cross-sells-list-item]")
          .querySelector('select[name="variant-id"]');
        if (select) {
          totalPrice += Number(select[select.selectedIndex].dataset.price);
          totalComparePrice += Number(
            select[select.selectedIndex].dataset.compareAtPrice
          );
        }
      }
    });

    const stripHtml = (html) => {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    this.querySelectorAll("[data-total-price]").forEach((elem) => {
      elem.textContent = stripHtml(window.Shopify.formatMoney(totalPrice)).replace(".00", "");
    });

    this.querySelectorAll("[data-total-compare-price]").forEach((elem) => {
      elem.textContent = stripHtml(window.Shopify.formatMoney(totalComparePrice)).replace(".00", "");
    });

    this.querySelectorAll("[data-total-savings]").forEach((elem) => {
      elem.textContent = stripHtml(window.Shopify.formatMoney(totalComparePrice - totalPrice)).replace(".00", "");
    });

    if (totalPrice === 0) {
      this.querySelector("[data-cross-sells-footer] .button").disabled = true;
    } else {
      this.querySelector("[data-cross-sells-footer] .button").disabled = false;
    }

    if (totalComparePrice > totalPrice) {
      this.querySelectorAll("[data-total-compare-price]").forEach((elem) => {
        elem.closest("s").removeAttribute("hidden");
      });
      this.querySelectorAll("[data-total-savings]").forEach((elem) => {
        elem.parentElement.removeAttribute("hidden");
      });
    } else {
      this.querySelectorAll("[data-total-compare-price]").forEach((elem) => {
        elem.closest("s").setAttribute("hidden", "hidden");
      });
      this.querySelectorAll("[data-total-savings]").forEach((elem) => {
        elem.parentElement.setAttribute("hidden", "hidden");
      });
    }
  }

  async addToCart(atcBtn) {
    atcBtn.classList.add("loading");
    atcBtn.disabled = true;
    atcBtn.setAttribute("aria-busy", "true");
    atcBtn.querySelector(".loading__spinner").classList.remove("hidden");

    const items = [];

    this.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      if (checkbox.checked) {
        const id = Number(
          checkbox
            .closest("[data-cross-sells-list-item]")
            .querySelector('[name="variant-id"]').value
        );

        items.push({
          id,
          quantity: 1,
        });
      }
    });

    try {
      const cart =
        document.querySelector("cart-notification") ||
        document.querySelector("cart-drawer");

      let sections = [];
      if (cart) {
        sections = cart.getSectionsToRender().map((section) => section.id);
      }

      const response = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, sections }),
      }); 

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();

      if (cart) {
        cart.renderContents(responseData);
        if (cart.classList.contains("is-empty")) {
          cart.classList.remove("is-empty");
        }
        // If it's a cart drawer, open it
        if (cart.tagName.toLowerCase() === 'cart-drawer') {
          cart.open();
        }
      } else {
        // If no cart component, redirect to cart page
        window.location.href = `${window.Shopify.routes.root}cart`;
      }
    } catch (error) {
      console.error('Error adding items to cart:', error);
      // Redirect to cart page on error
      window.location.href = `${window.Shopify.routes.root}cart`;
    } finally {
      atcBtn.style.width = "";
      atcBtn.classList.remove("loading");
      atcBtn.disabled = false;
      atcBtn.setAttribute("aria-busy", "false");
      atcBtn.querySelector(".loading__spinner").classList.add("hidden");
    }
  }
}
customElements.define("lumin-cross-sells", LuminCrossSells);