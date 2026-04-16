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
            :alt="normalizeImageLabel(img.label)"
            class="carousel-image"
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
              {{ normalizeImageLabel(img.label) }}
            </a>
          </template>
          <template v-else>
            {{ normalizeImageLabel(img.label) }}
          </template>
        </div>
      </Slide>

      <template #addons>
        <div class="carousel-controls">
          <Navigation v-if="visibleImages.length > 1"/>
          <Pagination v-if="visibleImages.length > 1"/>
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
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import {Carousel, Slide, Navigation, Pagination} from 'vue3-carousel'
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
    printerName: {
      type: String,
      required: false,
      default: '',
    },
  },
  data() {
    return {
      dialog: false,
      selectedImageIndex: null,
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
    selectedImage() {
      if (
          this.selectedImageIndex == null ||
          this.selectedImageIndex < 0 ||
          this.selectedImageIndex >= this.visibleImages.length
      ) {
        return null
      }
      return this.visibleImages[this.selectedImageIndex]
    },
    itemsToShow() {
      return this.visibleImages.length < 3 ? this.visibleImages.length || 1 : 3
    },
    carouselBreakpoints() {
      return {
        300: {itemsToShow: 1, itemsToScroll: 1},
        700: {itemsToShow: 2, itemsToScroll: 1},
        1024: {itemsToShow: 3, itemsToScroll: 1},
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

    normalizeImageLabel(label, fallback = 'Sans titre') {
      if (label === null || label === undefined) return fallback

      const clean = String(label).trim()

      if (!clean) return fallback

      if (clean.toLowerCase() === 'pas de titre') {
        return fallback
      }

      return clean
    },

    goToImage(index) {
      if (
          index == null ||
          index < 0 ||
          index >= this.visibleImages.length ||
          !this.tifyInstance
      ) {
        return
      }

      this.selectedImageIndex = index
      this.tifyInstance.setPage(index + 1)
      this.tifyInstance.setView(null)
    },

    goToPreviousImage() {
      this.goToImage(this.selectedImageIndex - 1)
    },

    goToNextImage() {
      this.goToImage(this.selectedImageIndex + 1)
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
      const startIndex = this.visibleImages.findIndex(
          (item) => this.getImageKey(item) === this.getImageKey(img)
      )

      this.selectedImageIndex = startIndex >= 0 ? startIndex : 0
      this.dialog = true

      this.$nextTick(() => {
        this.mountTifyForImages(this.selectedImageIndex)
      })
    },

    onDialogChange(isOpen) {
      if (!isOpen) {
        this.destroyTify()
        this.revokeManifestUrl()
        this.selectedImageIndex = null
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

    hasValidReferenceUrl(img) {
      return !!img?.reference_url && img.reference_url !== 'unknown_url'
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
          fr: ['Images de l’imprimeur lithographe :' + (this.printerName ? ` ${this.printerName}` : '')],
        },
        items: images.map((img, index) => {
          const imageUrl = this.resolveImageURL(img)
          const label = this.normalizeImageLabel(img?.label)
          const serviceId = this.inferIiifServiceId(img?.iiif_url)
          const hasReference = this.hasValidReferenceUrl(img)

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

          const canvas = {
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

          if (hasReference) {
            canvas.metadata = [
              {
                label: {fr: ['Référence']},
                value: {
                  fr: [`<a href="${img.reference_url}" target="_blank" rel="noopener noreferrer">${img.reference_url}</a>`],
                },
              },
            ]

            canvas.homepage = [
              {
                id: img.reference_url,
                type: 'Text',
                label: {fr: ['Voir la référence']},
                format: 'text/html',
              },
            ]
          }

          return canvas
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
        view: 'info',
      })

      this.tifyInstance.mount(this.$refs.tifyContainer)

      this.tifyInstance.ready.then(() => {
        this.tifyInstance.setPage(startIndex + 1)
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
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
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

.carousel-image {
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

:deep(.carousel-image) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
  border-bottom: 9px solid transparent;
  padding-bottom: 20px;
}


:deep(.carousel__slide img:hover) {
  transform: scale(0.82);
}

:deep(.carousel__slide.carousel__slide--active img) {
  transform: scale(1);
}

:deep(.carousel__slide.carousel__slide--active img:hover) {
  transform: scale(1.05);
}

:deep(.carousel__slide--active) {
  border-bottom: 9px solid var(--red-pompein);
}
</style>