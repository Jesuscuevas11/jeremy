/**
 * PebbeBee Volume Bundle Widget
 * Handles tier selection, variant dropdowns, quantity, and add-to-cart
 * Integrates with the theme's cart drawer / cart notification system.
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
      this.atcBtnText = this.atcBtn ? this.atcBtn.querySelector('span') : null;
      this.spinner = this.atcBtn ? this.atcBtn.querySelector('.loading__spinner') : null;
      this.errorEl = this.querySelector('.pb-volume-bundle__error');

      // Cart element — same reference product-form.js uses
      this.cart =
        document.querySelector('cart-notification') ||
        document.querySelector('cart-drawer');

      this.initTierSelection();
      this.initDropdowns();
      this.initAddToCart();

      // Mark pre-selected tier
      const defaultTier = this.querySelector('.pb-volume-bundle__tier.is-selected');
      if (defaultTier) {
        this.selectedTierIndex = this.tiers.indexOf(defaultTier);
      }
    }

    /* ── Tier selection ───────────────────────────────────────── */
    initTierSelection() {
      this.tiers.forEach((tier, index) => {
        tier.addEventListener('click', (e) => {
          if (
            e.target.closest('.pb-volume-bundle__dropdown') ||
            e.target.closest('.pb-volume-bundle__qty-input') ||
            e.target.closest('.pb-volume-bundle__addon') ||
            e.target.closest('.pb-volume-bundle__free-gift-select') ||
            e.target.tagName === 'INPUT' ||
            e.target.tagName === 'SELECT' ||
            e.target.tagName === 'A'
          ) return;
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

    /* ── Dropdowns ────────────────────────────────────────────── */
    initDropdowns() {
      this.querySelectorAll('.pb-volume-bundle__dropdown').forEach((dropdown) => {
        const selected = dropdown.querySelector('.pb-volume-bundle__dropdown-selected');
        const options = dropdown.querySelectorAll('.pb-volume-bundle__dropdown-option');
        const productRow = dropdown.closest('.pb-volume-bundle__product-row');

        selected.addEventListener('click', (e) => {
          e.stopPropagation();
          this.querySelectorAll('.pb-volume-bundle__dropdown.is-open').forEach((d) => {
            if (d !== dropdown) d.classList.remove('is-open');
          });
          dropdown.classList.toggle('is-open');
        });

        options.forEach((option) => {
          option.addEventListener('click', (e) => {
            e.stopPropagation();
            const { value, variantId, img, label } = option.dataset;

            const selectedText = dropdown.querySelector('.pb-volume-bundle__dropdown-selected-text');
            const selectedImg = dropdown.querySelector('.pb-volume-bundle__dropdown-selected-img');
            if (selectedText) selectedText.textContent = label;
            if (selectedImg && img) selectedImg.src = img;

            if (productRow) {
              const rowImg = productRow.querySelector('.pb-volume-bundle__product-image');
              if (rowImg && img) rowImg.src = img;
            }

            dropdown.dataset.selectedVariantId = variantId;
            options.forEach((o) => o.classList.remove('is-active'));
            option.classList.add('is-active');
            dropdown.classList.remove('is-open');
          });
        });
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.pb-volume-bundle__dropdown')) {
          this.querySelectorAll('.pb-volume-bundle__dropdown.is-open').forEach((d) => {
            d.classList.remove('is-open');
          });
        }
      });
    }

    /* ── Add to Cart ──────────────────────────────────────────── */
    initAddToCart() {
      if (!this.atcBtn) return;
      this.atcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.addToCart();
      });
    }

    getSelectedItems() {
      const tier = this.tiers[this.selectedTierIndex];
      if (!tier) return [];

      const items = [];

      // Main product rows
      tier.querySelectorAll('.pb-volume-bundle__product-row').forEach((row) => {
        const dropdown = row.querySelector('.pb-volume-bundle__dropdown');
        const qtyInput = row.querySelector('.pb-volume-bundle__qty-input');
        const variantId = dropdown
          ? dropdown.dataset.selectedVariantId
          : row.dataset.variantId;
        const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
        if (variantId) items.push({ id: parseInt(variantId, 10), quantity: qty });
      });

      // Free gift (tier 3 same-product)
      const freeGiftExpanded = tier.querySelector('.pb-volume-bundle__free-gift-expanded');
      if (freeGiftExpanded) {
        const giftSelect = freeGiftExpanded.querySelector('.pb-volume-bundle__free-gift-select');
        const giftVariantId = giftSelect
          ? giftSelect.value
          : freeGiftExpanded.dataset.variantId;
        if (giftVariantId) {
          items.push({
            id: parseInt(giftVariantId, 10),
            quantity: 1,
            properties: { _free_gift: 'true' },
          });
        }
      }

      // Add-on (optional checkbox)
      const addon = tier.querySelector('.pb-volume-bundle__addon');
      if (addon) {
        const checkbox = addon.querySelector('.pb-volume-bundle__addon-checkbox');
        if (checkbox && checkbox.checked) {
          const variantId = addon.dataset.variantId;
          const qty = parseInt(addon.dataset.qty, 10) || 1;
          if (variantId) items.push({ id: parseInt(variantId, 10), quantity: qty });
        }
      }

      return items;
    }

    setLoading(isLoading) {
      if (!this.atcBtn) return;
      if (isLoading) {
        this.atcBtn.setAttribute('aria-disabled', 'true');
        this.atcBtn.classList.add('loading');
        if (this.spinner) this.spinner.classList.remove('hidden');
      } else {
        this.atcBtn.removeAttribute('aria-disabled');
        this.atcBtn.classList.remove('loading');
        if (this.spinner) this.spinner.classList.add('hidden');
      }
    }

    async addToCart() {
      if (this.atcBtn && this.atcBtn.getAttribute('aria-disabled') === 'true') return;

      if (this.selectedTierIndex < 0) {
        this.showError('Please select an option.');
        return;
      }

      const items = this.getSelectedItems();
      if (!items.length) {
        this.showError('No items to add.');
        return;
      }

      this.setLoading(true);
      this.hideError();

      try {
        // Build sections list so the cart drawer can re-render — same as product-form.js
        const sectionsToRender = this.cart
          ? this.cart.getSectionsToRender().map((s) => s.id)
          : [];

        const body = {
          items,
          sections: sectionsToRender,
          sections_url: window.location.pathname,
        };

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (data.status) {
          throw new Error(data.description || data.message || 'Could not add to cart.');
        }

        // Publish cart update — same event product-form.js dispatches
        if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'pb-volume-bundle',
            cartData: data,
          });
        }

        // Re-render cart drawer or notification — same as product-form.js
        if (this.cart && typeof this.cart.renderContents === 'function') {
          if (this.cart.classList.contains('is-empty')) {
            this.cart.classList.remove('is-empty');
          }
          this.cart.renderContents(data);
        } else {
          window.location = window.routes ? window.routes.cart_url : '/cart';
        }
      } catch (error) {
        this.showError(error.message);
      } finally {
        this.setLoading(false);
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
