document.addEventListener('alpine:init', () => {
  Alpine.data('Video', (playback = 'inline', mode = 'preview') => ({
    player: null,
    enabled: false,
    shown: false,
    playing: false,
    id: '',
    playback,
    mode,
    init() {
      this.id = this.$root.id;
      //this.$store.modals.modal.open = true;
      document.body.addEventListener('pauseAllMedia', (e) => {
        if (e.detail !== null && e.detail.id === this.$root.id) {
          return;
        }

        //if autoplay, return
        if (this.mode === 'autoplay') return;
        this.pause();
      });

      this.$watch('enabled', (value) => {
        this.$nextTick(() => {
          this.shown = value;
        });

        if (value === true) {
          this.player = this.$root.querySelector('[\\@play][\\@pause]');

          this.player.addEventListener('playing', () => {
            this.playing = true;
          });

          this.player.addEventListener('paused', () => {
            this.playing = false;
          });
        }
      });

      this.$watch('playing', (value) => {
        if (value === true) {
          this.dispatchPauseAllMediaEvent();
        }
      });

      this.productMediaWrapper = this.$root.closest(
        '[data-product-single-media-wrapper]'
      );

      if (this.productMediaWrapper) {
        this.setUpProductMediaListeners();
      }

      if (this.mode === 'autoplay') {
        this.enabled = true;
      }
    },
    dispatchPauseAllMediaEvent() {
      document.body.dispatchEvent(
        new CustomEvent('pauseAllMedia', {
          detail: {
            id: this.$root.id,
          },
        })
      );
    },
    play() {
      if (this.enabled === false || this.player === null) return;

      this.player.dispatchEvent(new CustomEvent('play'));
    },
    pause() {
      if (this.enabled === false || this.player === null) return;

      this.player.dispatchEvent(new CustomEvent('pause'));
    },
    setUpProductMediaListeners() {
      this.productMediaWrapper.addEventListener('mediaHidden', () => {
        this.pause();
      });
      this.productMediaWrapper.addEventListener('mediaVisible', () => {});
    },
  }));
});
