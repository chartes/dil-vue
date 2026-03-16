<template>
  <div>
    <Carousel
      :itemsToShow="itemsToShow"
      :breakpoints="carouselBreakpoints"
      :wrapAround="true"
      :transition="500"
      class="slick-container"
    >
      <Slide
        v-for="(img, idx) in visibleImages"
        :key="img._id_dil || img.img_name || img.iiif_url || idx"
      >
        <img
          :src="resolveImageURL(img)"
          :alt="img.label"
          class="carousel__slide"
          @click="openImage(img)"
          @error="hideImage(img)"
        />

        <div class="text-center mt-2 caption">
          <template v-if="img.reference_url && img.reference_url !== 'unknown_url'">
            <a
              class="link_label_img_carousel"
              :href="img.reference_url"
              target="_blank"
              rel="noopener noreferrer"
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
          <Navigation v-if="visibleImages.length > 1" />
          <Pagination v-if="visibleImages.length > 1" />
        </div>
      </template>
    </Carousel>

    <v-dialog v-model="dialog" max-width="90%" @update:modelValue="onDialogChange">
      <v-card class="iiif-dialog-card">
        <v-card-title class="justify-end">
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="text-center">
          <div ref="tifyContainer" class="tify-container"></div>

          <div class="mt-4" v-if="selectedImage">
            <p class="image-label">{{ selectedImage.label }}</p>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { Carousel, Slide, Navigation, Pagination } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'

import Tify from 'tify'
import 'tify/dist/tify.css'

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
      hiddenImageKeys: new Set(),
      apiDBBase: this.$store.state.adminUrl.replace(/\/admin\/?$/, ''),
      tifyInstance: null,
      manifestObjectUrl: null,
    }
  },
  computed: {
    visibleImages() {
      return this.images.filter((img, idx) => {
        const key = this.getImageKey(img, idx)
        const url = this.resolveImageURL(img)
        return !!url && !this.hiddenImageKeys.has(key)
      })
    },
    itemsToShow() {
      return this.visibleImages.length < 3 ? this.visibleImages.length || 1 : 3
    },
    carouselBreakpoints() {
      return {
        300: { itemsToShow: 1, itemsToScroll: 1 },
        700: { itemsToShow: 2, itemsToScroll: 1 },
        1024: { itemsToShow: 3, itemsToScroll: 1 },
      }
    },
  },
  beforeUnmount() {
    this.destroyTify()
    this.revokeManifestUrl()
  },
  methods: {
    getImageKey(img, idx = 0) {
      return img?._id_dil || img?.img_name || img?.iiif_url || `${img?.label || 'img'}-${idx}`
    },

    resolveImageURL(img) {
      if (img?.iiif_url) {
        return img.iiif_url
      }
      if (img?.img_name) {
        return `${this.apiDBBase}/static/images_store/${img.img_name}`
      }
      return ''
    },

    hideImage(img) {
      const idx = this.images.indexOf(img)
      const key = this.getImageKey(img, idx)
      this.hiddenImageKeys = new Set([...this.hiddenImageKeys, key])
    },

    openImage(img) {
      this.selectedImage = img
      this.dialog = true

      const startIndex = this.visibleImages.findIndex(
          (item) => this.getImageKey(item) === this.getImageKey(img)
      )

      this.$nextTick(() => {
        this.mountTifyForImages(startIndex >= 0 ? startIndex : 0)
      })
    },

    onDialogChange(isOpen) {
      if (!isOpen) {
        this.destroyTify()
        this.revokeManifestUrl()
        this.selectedImage = null
      }
    },

    destroyTify() {
      if (this.tifyInstance && typeof this.tifyInstance.destroy === 'function') {
        this.tifyInstance.destroy()
      }
      this.tifyInstance = null

      if (this.$refs.tifyContainer) {
        this.$refs.tifyContainer.innerHTML = ''
      }
    },

    revokeManifestUrl() {
      if (this.manifestObjectUrl) {
        URL.revokeObjectURL(this.manifestObjectUrl)
        this.manifestObjectUrl = null
      }
    },

    inferIiifServiceId(url) {
      if (!url) return null

      // Cas classique IIIF Image API:
      // .../full/full/0/default.jpg
      // .../full/600,/0/default.jpg
      const match = url.match(/^(.*)\/full\/.*\/0\/default\.(jpg|jpeg|png|webp)$/i)
      return match ? match[1] : null
    },

    buildManifestForImages(images) {
      const manifestId = `urn:uuid:${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`

      return {
        '@context': 'http://iiif.io/api/presentation/3/context.json',
        id: manifestId,
        type: 'Manifest',
        label: {
          fr: ['Images de l’imprimeur'],
        },
        items: images.map((img, index) => {
          const imageUrl = this.resolveImageURL(img)
          const label = img?.label || `Image ${index + 1}`
          const serviceId = this.inferIiifServiceId(img?.iiif_url)

          const canvasId = `urn:uuid:canvas-${index}-${Date.now()}`
          const pageId = `urn:uuid:page-${index}-${Date.now()}`
          const annotationId = `urn:uuid:annotation-${index}-${Date.now()}`

          const body = {
            id: imageUrl,
            type: 'Image',
            format: 'image/jpeg',
          }

          if (serviceId) {
            body.service = [
              {
                id: serviceId,
                type: 'ImageService3',
                profile: 'level2',
              },
            ]
          }

          return {
            id: canvasId,
            type: 'Canvas',
            width: 3000,
            height: 3000,
            label: {
              fr: [label],
            },
            items: [
              {
                id: pageId,
                type: 'AnnotationPage',
                items: [
                  {
                    id: annotationId,
                    type: 'Annotation',
                    motivation: 'painting',
                    target: canvasId,
                    body,
                  },
                ],
              },
            ],
          }
        }),
      }
    },
    mountTifyForImages(startIndex = 0) {
      this.destroyTify()
      this.revokeManifestUrl()

      const manifest = this.buildManifestForImages(this.visibleImages)
      const blob = new Blob([JSON.stringify(manifest)], {
        type: 'application/ld+json',
      })
      this.manifestObjectUrl = URL.createObjectURL(blob)

      this.tifyInstance = new Tify({
        manifestUrl: this.manifestObjectUrl,
      })

      this.tifyInstance.mount(this.$refs.tifyContainer)

      this.tifyInstance.ready.then(() => {
        this.tifyInstance.setPage(startIndex + 1)
        this.tifyInstance.setView(null)
      })
    }
  }
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
  padding: 0 !important;
  box-sizing: border-box;
}

:deep(.carousel__slide) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
  border-bottom: 9px solid transparent;
}

:deep(.carousel__slide img) {
  width: 100%;
  height: 300px;
  object-fit: contain;
  border-radius: 8px;
  transition: transform 0.3s ease;
  transform: scale(0.75);
}

:deep(.carousel__slide.carousel__slide--active img) {
  transform: scale(1);
}

:deep(.carousel__slide--active) {
  border-bottom: 9px solid var(--light-brown);
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

.link_label_img_carousel {
  color: #000;
  text-decoration: none;
  font-size: 1.2rem;
}

.link_label_img_carousel:hover {
  color: #6e6e6e;
  cursor: pointer;
}

.carousel__slide {
  width: 100%;
  height: 500px;
  object-fit: contain;
  cursor: pointer;
}

.iiif-dialog-card {
  min-height: 80vh;
}

.tify-container {
  width: 100%;
  height: 70vh;
  min-height: 500px;
}

.image-label {
  font-size: 1rem;
  margin-bottom: 0;
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

  :deep(.v-card-text),
  :deep(.link_label_img_carousel),
  :deep(.carousel__slide.carousel__slide--active .caption) {
    font-size: 0.95rem;
  }

  .tify-container {
    height: 60vh;
    min-height: 420px;
  }
}

@media screen and (max-width: 699px) {
  :deep(.carousel-controls) {
    justify-content: space-between;
    padding: 0 10px;
  }

  .tify-container {
    height: 55vh;
    min-height: 360px;
  }
}
</style>