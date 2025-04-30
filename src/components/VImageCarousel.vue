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
          style="width: 100%; height: 400px; object-fit: contain; cursor: pointer;"
          @click="openImage(img)"
          @error="handleImgError"
        />
        <div v-if="isActive" class="text-center mt-2 caption">
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

    <!-- MODAL IMAGE -->
    <v-dialog v-model="dialog" max-width="80%">
      <v-card>
        <v-card-title class="justify-end">
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="text-center">
          <img
            v-if="selectedImage"
            :src="resolveImageURL(selectedImage)"
            :alt="selectedImage.label"
            style="max-width: 100%; max-height: 80vh; object-fit: contain;"
          />
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

export default {
  name: 'ImageCarousel',
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
        return `https://dev.chartes.psl.eu/dil/static/images_store/${img.img_name}`;
      }
      return '';
    },
    handleImgError(event) {
      const fallbackUrl = new URL('@/assets/images/preview-na.png', import.meta.url).href;
      event.target.src = fallbackUrl;
      event.target.style.width = '100%';
      event.target.style.height = '400px';
      event.target.style.objectFit = 'contain';
    },
  },
}
</script>

<style scoped>
/* Carrousel */

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
  justify-content: center; /* centrage vertical */
  min-height: 460px; /* HAUTEUR FIXE pour contenir image + flèches */
  padding: 1rem 0;
  box-sizing: border-box;
}

:deep(.carousel__viewport) {
  width: 100%;
  display: flex;
  justify-content: center; /* ajouté */
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

/* Effet sur l'image active */
:deep(.carousel__slide--active img) {
  transform: scale(1.03);
}

/* Bordure sur l'élément actif */
:deep(.carousel__slide--active) {
  border-bottom: 9px solid var(--light-brown);
  box-sizing: border-box;
  padding-bottom: 20px;
}

/* Boutons Précédent / Suivant */
:deep(.carousel-controls) {
  margin-top: 30px;
  margin-right: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  left: 10px;
}

/* Boutons de navigation */
:deep(.carousel-controls .carousel__prev),
:deep(.carousel-controls .carousel__next) {
  position: static; /* plus de position absolue */
  transform: none;
  background: url("@/assets/images/b_fleche.svg") center / contain no-repeat;
  background-color: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.8;
  width: 36px;
  height: 36px;
}

/* Inverser la flèche gauche */
:deep(.carousel-controls .carousel__prev) {
  transform: scaleX(-1);
}

/* Cacher les SVG par défaut */
:deep(.carousel-controls .carousel__prev svg),
:deep(.carousel-controls .carousel__next svg) {
  display: none;
}

/* Pagination cachée ou personnalisable ensuite */
:deep(.carousel-controls .carousel__pagination) {
  display: none;
}


/* Viewport du carousel */
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

/* Responsive pour mobile */
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
}

</style>
