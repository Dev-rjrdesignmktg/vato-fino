window['Theme_Product'] = ({
  product,
  variant,
  featuredMediaId,
  enableImageZoom = false,
  enableThumbnailsOnDesktop = false,
}) => {
  return {
    productForms: null,
    productRoot: null,
    product: product,
    currentVariant: variant,
    currentMediaId: featuredMediaId,
    loading: false,
    quantity: '1',
    optionHandles: [],
    storeAvailability: null,
    addedToCart: false,
    stickyAddToCartShown: false,
    variantChanged: false,
    updateStoreAvailability: null,
    videoInView: false,
    hasGiftCardRecipientForm: false,
    cartAddErrorMessage: '',
    lastClickedThumbnail: null,
    currentOption1: variant.option1,
    currentOption2: variant.option2,
    currentOption3: variant.option3,
    enableThumbnailsOnDesktop,
    get options() {
      let arr = [];
      if (this.currentOption1) {
        arr.push(this.currentOption1);
      }
      if (this.currentOption2) {
        arr.push(this.currentOption2);
      }
      if (this.currentOption3) {
        arr.push(this.currentOption3);
      }
      return arr;
    },
    get currentVariantId() {
      if (this.currentVariant) {
        return this.currentVariant.id;
      } else {
        return null;
      }
    },
    get currentVariantAvailabilityClosestLocation() {
      // this is on a lag to the actual current variant so that we can display an intermediary state while the fetch request is happening
      if (!Alpine.store('availability')) return null;

      const id = this.currentVariantId;
      const storeData = Alpine.store('availability').availability[id];

      if (storeData) {
        return storeData.closest_location;
      } else {
        return null;
      }
    },
    get currentVariantAvailable() {
      if (this.currentVariant) {
        return this.currentVariant.available;
      } else {
        return null;
      }
    },
    get currentVariantTitle() {
      if (this.currentVariant && this.currentVariant.title) {
        if (!this.currentVariant.title.includes('Default')) {
          return this.currentVariant.title;
        }
      }
      return '';
    },
    get current_price() {
      return this.currentVariant.price;
    },
    get isUsingSlideshowToDisplayMedia() {
      const splideEl = this.productRoot.querySelector('.splide');

      return splideIsNotDestroyed(splideEl);
    },
    formatMoney(price, moneyFormat = theme.defaultMoneyFormat) {
      return formatMoney(price, moneyFormat);
    },
    init() {
      // Set a product root for nested components
      // to use instead of $root (which refers to their root)
      this.productRoot = this.$root;

      if (this.$root.querySelector('[x-data="Theme_GiftCardRecipient"]')) {
        this.hasGiftCardRecipientForm = true;
      }

      this.updateStoreAvailability = debounce(
        this.__updateStoreAvailability.bind(this),
        150
      );

      this.productForm = this.$root.querySelector(
        `[data-product-form-container]`
      );

      if (theme.settings.cart_type === 'drawer') {
        const formEl = this.productForm.querySelector('.product-form');
        if (formEl) {
          formEl.addEventListener('submit', this.submitForm.bind(this));
        }
      }

      this.getOptionHandles();

      this.$root.addEventListener('cascade:product:slidechange', (e) => {
        this.currentMediaId = parseInt(e.detail.currentMediaId, 10);
      });

      this.$watch('currentMediaId', (value, oldValue) => {
        let shouldFocusWrapper = false;

        if (this.lastClickedThumbnail === value) {
          shouldFocusWrapper = true;
        }

        this.lastClickedThumbnail = null;

        const currentMediaObject = this.product.media.filter((media) => {
          return media.id === value;
        })[0];

        this.videoInView =
          currentMediaObject.media_type === 'video' ||
          currentMediaObject.media_type === 'external_video'
            ? true
            : false;

        if (this.isUsingSlideshowToDisplayMedia) {
          if (shouldFocusWrapper) {
            const newMediaWrapperEl = Array.from(
              this.$root.querySelectorAll(
                `[data-product-single-media-wrapper="${value}"]`
              )
            ).filter((mediaWrapperEl) =>
              Boolean(mediaWrapperEl.offsetParent)
            )[0];

            if (newMediaWrapperEl) {
              this.$focus.focus(newMediaWrapperEl);
            }
          }
        }

        if (this.enableThumbnailsOnDesktop) {
          this.$root.dispatchEvent(
            new CustomEvent('cascade:product:mediachange', {
              bubbles: true,
              detail: {
                media_id: this.currentMediaId,
                slideshow_id: this.$root.querySelector('.splide--product')?.id,
              },
            })
          );
        }

        // There can be more than one media (e.g. for different breakpoints)
        // so we check the offsetHeight to see if the wrapper could currently
        // be visible

        // https://davidwalsh.name/offsetheight-visibility

        this.$root
          .querySelectorAll(`[data-product-single-media-wrapper="${oldValue}"]`)
          .forEach((mediaWrapperEl) => {
            if (Boolean(mediaWrapperEl.offsetHeight)) {
              mediaWrapperEl.dispatchEvent(new CustomEvent('mediaHidden'));
            }
          });

        this.$root
          .querySelectorAll(`[data-product-single-media-wrapper="${value}"]`)
          .forEach((mediaWrapperEl) => {
            if (Boolean(mediaWrapperEl.offsetHeight)) {
              mediaWrapperEl.dispatchEvent(new CustomEvent('mediaVisible'));
            }
          });
      });

      this.updateStoreAvailability(this.currentVariant);
    },
    __updateStoreAvailability(variant) {
      if (!this.$refs.storeAvailabilityContainer) return;

      this.storeAvailability =
        this.storeAvailability ||
        new StoreAvailability(this.$refs.storeAvailabilityContainer);

      if (this.storeAvailability && variant) {
        this.storeAvailability.fetchContent(variant);
      }
    },
    optionChange() {
      this.getOptionHandles();

      const matchedVariant = ShopifyProduct.getVariantFromOptionArray(
        this.product,
        this.options
      );

      this.currentVariant = matchedVariant;

      if (this.currentVariant) {
        variantLiveRegion(this.currentVariant);
        this.updateStoreAvailability(this.currentVariant);

        if (this.currentVariant.featured_media) {
          this.currentMediaId = this.currentVariant.featured_media.id;
        }

        const url = ShopifyProductForm.getUrlWithVariant(
          window.location.href,
          this.currentVariant.id
        );

        this.$root.dispatchEvent(
          new CustomEvent('product-url-update', {
            bubbles: true,
            detail: { url: url },
          })
        );

        const inFormNameEl =
          this.$refs.singleVariantSelector || this.$refs.productFormNameField;

        if (inFormNameEl) {
          inFormNameEl.dispatchEvent(new Event('change', { bubbles: true }));
        }

        this.$root.dispatchEvent(
          new CustomEvent('cascade:product:variantchange', {
            bubbles: true,
            detail: { variant: this.currentVariant },
          })
        );

        this.variantChanged = true;
      }
    },
    getOptionHandles() {
      this.optionHandles = [];

      const selectors = this.productForm.querySelectorAll(
        '[data-single-option-selector]'
      );

      selectors.forEach((selector) => {
        if (selector.nodeName === 'SELECT') {
          this.optionHandles.push(
            selector.options[selector.selectedIndex].dataset.handle
          );
        } else {
          if (selector.checked) {
            this.optionHandles.push(selector.dataset.handle);
          }
        }
      });
    },
    submitForm(evt) {
      evt.preventDefault();
      this.loading = true;
      this.addedToCart = false;

      liveRegion(window.theme.strings.loading);

      const formData = new FormData(evt.target);
      const formId = evt.target.getAttribute('id');

      let modalCart = theme.settings.cart_type === 'drawer';

      const config = fetchConfigDefaults('javascript');

      if (modalCart) {
        formData.append('sections', 'cart-items,cart-footer,cart-item-count');
        formData.append('sections_url', window.location.pathname);
      }

      config.body = formData;

      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      fetch(`${theme.routes.cart_add_url}`, config)
        .then((res) => res.json())
        .then((data) => {
          if (data.status) {
            this.loading = false;

            const errors = data.errors || data.description;
            const message = data.description || data.message;

            // Gift card recipient form errors are handled in gift-card-recipient.js
            if (!this.hasGiftCardRecipientForm) {
              this.cartAddErrorMessage =
                message || window.theme.strings.cartError;
            }

            document.body.dispatchEvent(
              new CustomEvent('cascade:cart:adderror', {
                detail: {
                  source: 'product-form',
                  sourceId: formId,
                  variantId: formData.get('id'),
                  errors,
                  message,
                },
              })
            );
            return;
          }

          this.loading = false;
          this.cartAddErrorMessage = null;
          this.addedToCart = true;

          if (modalCart) {
            document.body.dispatchEvent(
              new CustomEvent('cascade:modalcart:afteradditem', {
                bubbles: true,
                detail: { response: data },
              })
            );
          }

          if (!document.querySelector('[data-show-on-add="true"]')) {
            if (this.$refs.added)
              this.$nextTick(() => this.$refs.added.focus());
          }
        })
        .catch((error) => {
          console.log(error);
        });
    },
    openZoom(mediaId) {
      const zoomModalId = `image-zoom-${this.productRoot.id}`;

      if (!this.$store.modals.modals[zoomModalId]) {
        this.$store.modals.register(zoomModalId, 'modal');
      }

      this.$watch('$store.modals.modal.contents', (val) => {
        if (val === zoomModalId) {
          this.$nextTick(() => {
            const zoomModalEl = document.getElementById(zoomModalId);

            waitForContent(zoomModalEl).then(() => {
              const mediaEl = zoomModalEl.querySelector(
                `[data-media-id="${mediaId}"]`
              );

              if (mediaEl) {
                mediaEl.scrollIntoView();
              }
            });
          });
        }
      });

      this.$store.modals.open(zoomModalId);
    },
  };
};
