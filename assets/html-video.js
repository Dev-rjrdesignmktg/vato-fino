document.addEventListener('alpine:init', () => {
  Alpine.data('HTMLVideo', () => ({
    init() {
      this.$refs.video.addEventListener('play', () => {
        this.$root.dispatchEvent(
          new CustomEvent('playing', {
            bubbles: true,
          })
        );
      });

      this.$refs.video.addEventListener('pause', () => {
        this.$root.dispatchEvent(
          new CustomEvent('paused', {
            bubbles: true,
          })
        );
      });

      // Safari won't autoplay inserted videos
      if (this.$refs.video.autoplay) {
        this.$nextTick(() => this.play());
      }
    },
    play() {
      // play() returns a promise that rejects with AbortError when a pause()
      // (e.g. off-screen / carousel change) interrupts it. That's expected, so
      // swallow it instead of logging an uncaught console error.
      const promise = this.$refs.video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch((error) => {
          if (error && error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
            console.error(error);
          }
        });
      }
      return promise;
    },
    pause() {
      this.$refs.video.pause();
    },
  }));
});
