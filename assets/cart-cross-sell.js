document.addEventListener('alpine:init', () => {
  Alpine.data('ThemeModule_CartCrossSellItem', ({ variantId, available }) => {
    return {
      variantId,
      available,
      loading: false,
      added: false,
      hasError: false,
      addToCart() {
        if (!this.available || this.loading || this.added) return;

        this.loading = true;
        this.hasError = false;

        const config = fetchConfigDefaults('javascript');

        config.body = JSON.stringify({
          items: [{ id: this.variantId, quantity: 1 }],
          sections: 'cart-items,cart-footer,cart-item-count,cart-live-region',
          sections_url: window.location.pathname,
        });

        fetch(theme.routes.cart_add_url, config)
          .then((res) => res.json())
          .then((data) => {
            if (data.status) {
              this.hasError = true;

              document.body.dispatchEvent(
                new CustomEvent('cascade:cart:adderror', {
                  detail: {
                    source: 'cart-cross-sell',
                    variantId: this.variantId,
                    errors: data.errors || data.description,
                    message: data.description || data.message,
                  },
                })
              );

              return;
            }

            this.added = true;

            document.body.dispatchEvent(
              new CustomEvent('cascade:modalcart:afteradditem', {
                bubbles: true,
                detail: { response: data },
              })
            );
          })
          .catch(() => {
            this.hasError = true;
          })
          .finally(() => {
            this.loading = false;
          });
      },
    };
  });
});
