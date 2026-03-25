/**
 * PebbeBee Volume Bundle Widget
 * Handles tier selection, variant dropdowns, quantity, and add-to-cart
 */
(function () {
  'use strict';

  class PbVolumeBundle extends HTMLElement {
    constructor() {
      super();
      this.tiers = [];
      this.selectedTierIndex = -1;
    }

    connectedCallback() {
      this.tiers = Array.from(this.querySelectorAll('.pb-volume-bundle__tier'));
      this.atcBtn = this.querySelector('.pb-volume-bundle__atc-btn');
      this.errorEl = this.querySelector('.pb-volume-bundle__error');

      this.initTierSelection();
      this.initDropdowns();
      this.initAddToCart();

      // Select default tier
      const defaultTier = this.querySelector('.pb-volume-bundle__tier.is-selected');
      if (defaultTier) {
        this.selectedTierIndex = this.tiers.indexOf(defaultTier);
      }
    }

    initTierSelection() {
      this.tiers.forEach((tier, index) => {
        tier.addEventListener('click', (e) => {
          // Don't switch tier when clicking dropdowns, inputs, checkboxes, selects, or addon areas
          if (
            e.target.closest('.pb-volume-bundle__dropdown') ||
            e.target.closest('.pb-volume-bundle__qty-input') ||
            e.target.closest('.pb-volume-bundle__addon') ||
            e.target.closest('.pb-volume-bundle__free-gift-select') ||
            e.target.tagName === 'INPUT' ||
            e.target.tagName === 'SELECT' ||
            e.target.tagName === 'A'
          ) {
            return;
          }
          this.selectTier(index);
        });
      });
    }

    selectTier(index) {
      this.tiers.forEach((tier, i) => {
        const radio = tier.querySelector('.pb-volume-bundle__radio-input');
        if (i === index) {
          tier.classList.add('is-selected');
          if (radio) radio.checked = true;
        } else {
          tier.classList.remove('is-selected');
          if (radio) radio.checked = false;
        }
      });
      this.selectedTierIndex = index;
      this.hideError();
    }

    initDropdowns() {
      const dropdowns = this.querySelectorAll('.pb-volume-bundle__dropdown');

      dropdowns.forEach((dropdown) => {
        const selected = dropdown.querySelector('.pb-volume-bundle__dropdown-selected');
        const menu = dropdown.querySelector('.pb-volume-bundle__dropdown-menu');
        const options = dropdown.querySelectorAll('.pb-volume-bundle__dropdown-option');
        const productRow = dropdown.closest('.pb-volume-bundle__product-row');

        // Toggle dropdown on click
        selected.addEventListener('click', (e) => {
          e.stopPropagation();

          // Close all other dropdowns
          this.querySelectorAll('.pb-volume-bundle__dropdown.is-open').forEach((d) => {
            if (d !== dropdown) d.classList.remove('is-open');
          });

          dropdown.classList.toggle('is-open');
        });

        // Option selection
        options.forEach((option) => {
          option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.dataset.value;
            const variantId = option.dataset.variantId;
            const imgSrc = option.dataset.img;
            const label = option.dataset.label;

            // Update selected display
            const selectedText = dropdown.querySelector('.pb-volume-bundle__dropdown-selected-text');
            const selectedImg = dropdown.querySelector('.pb-volume-bundle__dropdown-selected-img');
            if (selectedText) selectedText.textContent = label;
            if (selectedImg && imgSrc) selectedImg.src = imgSrc;

            // Update product row image
            if (productRow) {
              const rowImg = productRow.querySelector('.pb-volume-bundle__product-image');
              if (rowImg && imgSrc) rowImg.src = imgSrc;
            }

            // Store variant id
            dropdown.dataset.selectedVariantId = variantId;

            // Mark active
            options.forEach((o) => o.classList.remove('is-active'));
            option.classList.add('is-active');

            dropdown.classList.remove('is-open');
          });
        });
      });

      // Close dropdowns when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.pb-volume-bundle__dropdown')) {
          this.querySelectorAll('.pb-volume-bundle__dropdown.is-open').forEach((d) => {
            d.classList.remove('is-open');
          });
        }
      });
    }

    initAddToCart() {
      if (!this.atcBtn) return;

      this.atcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.addToCart();
      });
    }

    getSelectedTierItems() {
      const tier = this.tiers[this.selectedTierIndex];
      if (!tier) return [];

      const items = [];
      const productRows = tier.querySelectorAll('.pb-volume-bundle__product-row');

      productRows.forEach((row) => {
        const dropdown = row.querySelector('.pb-volume-bundle__dropdown');
        const qtyInput = row.querySelector('.pb-volume-bundle__qty-input');
        const variantId = dropdown ? dropdown.dataset.selectedVariantId : row.dataset.variantId;
        const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;

        if (variantId) {
          items.push({ id: parseInt(variantId, 10), quantity: qty });
        }
      });

      // Check for free gift
      const freeGift = tier.querySelector('.pb-volume-bundle__free-gift-expanded');
      if (freeGift && tier.classList.contains('is-selected')) {
        const giftSelect = freeGift.querySelector('.pb-volume-bundle__free-gift-select');
        const giftVariantId = freeGift.dataset.variantId;

        let freeGiftId = null;
        if (giftSelect) {
          freeGiftId = giftSelect.value;
        } else if (giftVariantId) {
          freeGiftId = giftVariantId;
        }

        if (freeGiftId) {
          items.push({
            id: parseInt(freeGiftId, 10),
            quantity: 1,
            properties: { _free_gift: 'true' },
          });
        }
      }

      return items;
    }

    getAddonItems() {
      const tier = this.tiers[this.selectedTierIndex];
      if (!tier) return [];

      const items = [];
      const addons = tier.querySelectorAll('.pb-volume-bundle__addon');

      addons.forEach((addon) => {
        const checkbox = addon.querySelector('.pb-volume-bundle__addon-checkbox');
        if (checkbox && checkbox.checked) {
          const variantId = addon.dataset.variantId;
          const qty = parseInt(addon.dataset.qty, 10) || 1;
          if (variantId) {
            items.push({ id: parseInt(variantId, 10), quantity: qty });
          }
        }
      });

      return items;
    }

    async addToCart() {
      if (this.selectedTierIndex < 0) {
        this.showError('Please select an option');
        return;
      }

      const tierItems = this.getSelectedTierItems();
      const addonItems = this.getAddonItems();
      const allItems = [...tierItems, ...addonItems];

      if (allItems.length === 0) {
        this.showError('No items to add');
        return;
      }

      this.atcBtn.classList.add('is-loading');
      this.atcBtn.textContent = 'Adding...';
      this.hideError();

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: allItems }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.description || 'Could not add to cart');
        }

        // Success - redirect to cart or open cart drawer
        this.atcBtn.textContent = 'Added!';

        // Try to open cart drawer if available
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer && typeof cartDrawer.open === 'function') {
          // Refresh the cart drawer contents
          const cartResponse = await fetch('/cart.js');
          const cartData = await cartResponse.json();

          // Dispatch event for theme cart updates
          document.dispatchEvent(
            new CustomEvent('cart:updated', { detail: { cart: cartData } })
          );

          // Try multiple approaches to refresh and open the drawer
          if (typeof cartDrawer.renderContents === 'function') {
            const sectionResponse = await fetch('/?sections=cart-drawer');
            const sections = await sectionResponse.json();
            cartDrawer.renderContents({ sections });
          }
          cartDrawer.open();
        } else {
          // Fallback: redirect to cart page
          window.location.href = '/cart';
        }

        setTimeout(() => {
          this.atcBtn.textContent = 'Add to Cart';
          this.atcBtn.classList.remove('is-loading');
        }, 1500);
      } catch (error) {
        this.showError(error.message);
        this.atcBtn.textContent = 'Add to Cart';
        this.atcBtn.classList.remove('is-loading');
      }
    }

    showError(msg) {
      if (this.errorEl) {
        this.errorEl.textContent = msg;
        this.errorEl.classList.add('is-visible');
      }
    }

    hideError() {
      if (this.errorEl) {
        this.errorEl.classList.remove('is-visible');
      }
    }
  }

  if (!customElements.get('pb-volume-bundle')) {
    customElements.define('pb-volume-bundle', PbVolumeBundle);
  }
})();
