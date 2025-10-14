<template>
  <div>
    <Carousel
      :itemsToShow="itemsToShow"
      :breakpoints="carouselBreakpoints"
      :wrapAround="true"
      :transition="500"
      class="slick-container"
    >
      <Slide v-for="(img, idx) in images" :key="idx" v-slot="{ isActive }">
        <img
          :src="resolveImageURL(img)"
          :alt="img.label"
          class="carousel__slide"
          @click="openImage(img)"
          @error="handleImgError"
        />
        <div class="text-center mt-2 caption">
          <template v-if="img.reference_url && img.reference_url !== 'unknown_url'">
            <a
              class="link_label_img_carousel"
              :href="img.reference_url"
              target="_blank"
              @click.stop
            >
              {{ img.label }}
            </a>
          </template>
          <template v-else>
            {{ img.label }}
          </template>
        </div>
      </Slide>

      <template #addons>
        <div class="carousel-controls">
          <Navigation v-if="images.length > 1" />
          <Pagination v-if="images.length > 1" />
        </div>
      </template>
    </Carousel>
    <v-dialog v-model="dialog" max-width="80%">
      <v-card>
        <v-card-title class="justify-end">
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="text-center">
  <div v-if="selectedImage" class="zoom-box" v-zoom>
    <img
      :src="resolveImageURL(selectedImage)"
      :alt="selectedImage.label"
      class="zoom-img"
      draggable="false"
    />
  </div>

  <div class="mt-4">
    <p class="image-label">{{ selectedImage?.label }}</p>
  </div>
</v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { Carousel, Slide, Navigation, Pagination } from 'vue3-carousel';
import 'vue3-carousel/dist/carousel.css';

// --- Directive v-zoom on img modal (wheel + drag + dblclick reset) ---
const ZoomDirective = {
  mounted(el) {
    const img = el.querySelector('img');
    let zoomed = false;
    let scale = 1;
    let x = 0, y = 0;
    const max = 5;
    let isPanning = false;
    let startX = 0, startY = 0, startXOffset = 0, startYOffset = 0;

    el.style.overflow = 'hidden';
    el.style.touchAction = 'none';
    el.style.cursor = 'grab';
    img.style.transformOrigin = '0 0';

    function update() {
      if (!zoomed) return;
      img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }

    function getRect() {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height, left: r.left, top: r.top };
    }

    function enterZoomModeAtCurrentView() {
      if (zoomed) return;
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;

      const elRect = getRect();
      const r = img.getBoundingClientRect();
      const rw = r.width, rh = r.height;

      const scaleW = rw / iw;
      const scaleH = rh / ih;
      scale = Math.min(scaleW, scaleH);

      x = r.left - elRect.left;
      y = r.top - elRect.top;

      img.classList.add('is-zoomed');
      zoomed = true;
      update();
    }

    function constrain() {
      if (!zoomed) return;
      const elRect = getRect();
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const vw = iw * scale;
      const vh = ih * scale;

      if (vw <= elRect.w) x = (elRect.w - vw) / 2;
      else {
        const minX = elRect.w - vw;
        const maxX = 0;
        x = Math.min(maxX, Math.max(minX, x));
      }

      if (vh <= elRect.h) y = (elRect.h - vh) / 2;
      else {
        const minY = elRect.h - vh;
        const maxY = 0;
        y = Math.min(maxY, Math.max(minY, y));
      }
    }

    function onWheel(e) {
      e.preventDefault();
      if (!zoomed) enterZoomModeAtCurrentView();

      const elRect = el.getBoundingClientRect();
      const offsetX = e.clientX - elRect.left - x;
      const offsetY = e.clientY - elRect.top - y;

      const delta = -e.deltaY;
      const step = 0.2;
      const newScale = Math.min(max, Math.max(scale + (delta > 0 ? step : -step), 0.1));
      if (newScale === scale) return;

      const ratio = newScale / scale;
      x = e.clientX - elRect.left - offsetX * ratio;
      y = e.clientY - elRect.top - offsetY * ratio;

      scale = newScale;
      constrain();
      update();
    }

    function onDown(e) {
      if (!zoomed) return;
      isPanning = true;
      el.style.cursor = 'grabbing';
      const p = (e.touches && e.touches[0]) || e;
      startX = p.clientX;
      startY = p.clientY;
      startXOffset = x;
      startYOffset = y;
      window.addEventListener('mousemove', onMove, { passive: false });
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onUp);
    }

    function onMove(e) {
      if (!isPanning) return;
      e.preventDefault();
      const p = (e.touches && e.touches[0]) || e;
      x = startXOffset + (p.clientX - startX);
      y = startYOffset + (p.clientY - startY);
      constrain();
      update();
    }

    function onUp() {
      isPanning = false;
      el.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    }

    function onDblClick() {
      zoomed = false;
      img.classList.remove('is-zoomed');
      img.style.transform = 'none';
      x = 0; y = 0; scale = 1;
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown, { passive: false });
    el.addEventListener('dblclick', onDblClick);

    el._zoomCleanup = () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onDown);
      el.removeEventListener('touchstart', onDown);
      el.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  },
  unmounted(el) {
    if (el._zoomCleanup) el._zoomCleanup();
  }
};

export default {
  name: 'ImageCarousel',
  directives: {
    zoom: ZoomDirective,
  },
  components: {
    Carousel,
    Slide,
    Navigation,
    Pagination,
  },
  props: {
    images: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      dialog: false,
      selectedImage: null,
      apiDBBase: this.$store.state.adminUrl.replace(/\/admin\/?$/, ''),
    }
  },
  computed: {
    itemsToShow() {
      return this.images.length < 3 ? this.images.length : 3;
    },
    carouselBreakpoints() {
      return {
        300: { itemsToShow: 1, itemsToScroll: 1 },
        700: { itemsToShow: 2, itemsToScroll: 1 },
        1024: { itemsToShow: 3, itemsToScroll: 1 },
      };
    },
  },
  methods: {
    openImage(img) {
      this.selectedImage = img;
      this.dialog = true;
    },
    resolveImageURL(img) {
      if (img.iiif_url) {
        return img.iiif_url;
      }
      if (img.img_name) {
        return `${this.apiDBBase}/static/images_store/${img.img_name}`;
      }
      return '';
    },
    handleImgError(event) {
      const fallbackUrl = new URL('@/assets/images/icons/preview-na.png', import.meta.url).href;
      event.target.src = fallbackUrl;
      event.target.style.width = '100%';
      event.target.style.height = '400px';
      event.target.style.objectFit = 'contain';
    },
  },
}
</script>

<style scoped>

.carousel {
  margin: 30px 0 20px;
}

.carousel__item {
  min-height: 300px;
  width: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
}


li.carousel__slide img {
  transform: scale(0.7);
}


:deep(.carousel-wrapper) {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 460px;
  padding: 1rem 0;
  box-sizing: border-box;
}

:deep(.carousel__viewport) {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  padding: 0 20px;
  box-sizing: border-box;
}


:deep(.carousel__slide) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

:deep(.carousel__slide img) {
  width: 100%;
  height: 300px;
  object-fit: contain;
  border-radius: 8px;
  /* box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); */
  transition: transform 0.3s ease;
  transform: scale(0.75);
}

:deep(.carousel__slide.carousel__slide--active img) {
  transform: scale(1);
}

:deep(.carousel-controls) {
  margin-right: 0 !important;
}

:deep(.carousel__viewport) {
  padding: 0 !important;
}

:deep(.carousel__slide .caption) {
  margin: 30px 0 !important;
  position: relative;
  opacity: 0;
  transition: all ease-in-out 0.5s;
}

:deep(.carousel__slide.carousel__slide--active .caption) {
  opacity: 1;
}

:deep(.carousel__slide) {
  box-sizing: border-box;
  border-bottom: 9px solid transparent;
}

:deep(.carousel__slide--active) {
  border-bottom: 9px solid var(--light-brown);
}

:deep(.carousel-controls) {
  margin-top: 30px;
  margin-right: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  left: 10px;
}


:deep(.carousel-controls .carousel__prev),
:deep(.carousel-controls .carousel__next) {
  position: static;
  transform: none;
  background: url("@/assets/images/icons/b_fleche.svg") center / contain no-repeat;
  background-color: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.8;
  width: 36px;
  height: 36px;
}


:deep(.carousel-controls .carousel__prev) {
  transform: scaleX(-1);
}


:deep(.carousel-controls .carousel__prev svg),
:deep(.carousel-controls .carousel__next svg) {
  display: none;
}


:deep(.carousel-controls .carousel__pagination) {
  display: none;
}

:deep(.carousel__viewport) {
  background-color: transparent;
  padding: 0 20px;
  width: 100%;
}

.link_label_img_carousel {
  color: #000;
  text-decoration: none;
  font-size: 1.2rem;
}

.link_label_img_carousel:hover {
  color: #6E6E6E;
  cursor: pointer;
}


.img-fluid {
  max-width: 100%;
  max-height: calc(100vh - 300px);
  object-fit: contain;
}

.carousel__slide {
  width: 100%;
  height: 500px;
  object-fit: contain;
  cursor: pointer;
}

@media screen and (max-width: 1024px) {
  :deep(.carousel__slide img) {
    height: 250px;
  }

  :deep(.carousel__prev),
  :deep(.carousel__next) {
    width: 28px;
    height: 28px;
    background-size: 24px;
  }

  :deep(.carousel__prev) {
    left: -30px;
  }

  :deep(.carousel__next) {
    right: -30px;
  }

  :deep(.v-card-text),
  :deep(.link_label_img_carousel),
  :deep(.carousel__slide.carousel__slide--active .caption) {
    font-size: 0.95rem;
  }

  :deep(.v-btn--icon.v-btn--density-default) {
    width: calc(var(--v-btn-height) + 2px);
    height: calc(var(--v-btn-height) + 2px);
  }

}

@media screen and (max-width: 699px) {
  :deep(.carousel-controls) {
    justify-content: space-between;
    padding: 0 10px;
  }
}

.zoom-box {
  position: relative;
  overflow: hidden;
  max-height: calc(100vh - 300px);
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #00000008;
  border-radius: 8px;
}

.zoom-img {
  max-width: 100%;
  max-height: calc(100vh - 300px);
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  will-change: transform;
  transition: transform 0.05s linear;
  transform: none;
}

.zoom-img.is-zoomed {
  max-width: none;
  max-height: none;
  object-fit: unset;
}
</style>
