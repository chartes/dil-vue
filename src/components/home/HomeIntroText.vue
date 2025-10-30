<template>
  <v-row class="home-container d-flex justify-start">
    <v-col cols="12" md="6" class="left-section">
      <div class="intro-block">
        <h3 class="my-2 subtitle d-flex align-center">
          <v-icon class="mr-2" color="var(--light-brown-alt)">mdi-book-open-page-variant</v-icon>
          Une technique révolutionnaire sous surveillance
        </h3>

        <p class="text-intro">
         En 1817, dans l’arsenal de surveillance des métiers du livre apparaît un brevet d’imprimeur lithographe sans
          lequel nul ne peut exploiter la lithographie, cette nouvelle technique d’impression, inventée vingt ans plus
          tôt en Allemagne. Sage précaution qui permet aux régimes successifs, jusqu’en 1870, d’empêcher que ce procédé
          rapide et peu cher ne profite à l’estampe politique. La lithographie n’en connaît pas moins un très grand
          essor, tant elle répond, par la multiplicité de ses utilisations aux besoins d’un siècle de transformations
          économiques et sociales profondes. Bien plus que l’illustration des livres et les estampes satiriques, ce sont
          donc les travaux de ville et la publicité commerciale, les impressions administratives et judiciaires, les
          dessins techniques et cartographiques et les décors d’objets de demi-luxe dont la consommation se démocratise,
          qui, au XIX<sup>e</sup> siècle font vivre les imprimeurs lithographes et tourner leurs presses.
        </p>
      </div>
    </v-col>
    <v-col cols="12" md="6" class="right-section">
      <div class="intro-block">
        <h3 class="my-2 subtitle d-flex align-center">
          <v-icon class="mr-2" color="var(--light-brown-alt)">mdi-magnify</v-icon>
          Un dictionnaire
        </h3>
        <p class="text-intro">
          Ce dictionnaire met en lumière plus de 5 000 imprimeurs-lithographes, parisiens et provinciaux, à partir du
          dépouillement des dossiers constitués pour l’obtention du brevet d’imprimeur-lithographe déposés aux Archives
          nationales et, après 1870, des simples déclarations d’activité. Les notices riches et documentées croisent
          données personnelles et professionnelles avec des sources variées (correspondances, dossiers de faillite,
          brevets d’invention, archives notariales et policières, collections d’estampes et de livres). Cet outil permet
          des recherches sur un monde d’imprimeurs qui a façonné la culture visuelle de son temps.
        </p>
      </div>
    </v-col>
     <!-- BOUTON CENTRAL -->
    <v-col cols="12" class="d-flex justify-center">
      <v-btn
          class="btn-to-info"
          rounded elevation="4"
          to="/information?section=dictionary"
      >
        Plus d'information
      </v-btn>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'IntroText',
  data() {
    return {}
  }
}
</script>

<style scoped>
.home-container {
  align-items: stretch;
}

.left-section,
.right-section {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
}

.intro-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 3rem 2rem 0 2rem;
}

.subtitle {
  font-size: 1.4rem;
  font-weight: bold;
  display: flex;
  align-items: flex-start !important;
  gap: 5px;
}

.text-intro {
  font-size: 1.2rem;
  line-height: 1.7;
}

.justify-center {
  justify-content: center !important;
  //margin-top: -100px;
}

.btn-to-info {
  background-color: var(--brown);
  color: white;
  font-weight: 600;
  text-transform: none;
  padding: 8px 23px;
  font-size: 1.1rem;
}

.btn-to-info:hover {
  background-color: var(--light-brown);
  color: white;
}




@media screen and (max-width: 960px) {

  .intro-block {
    padding: 20px 10px 0;
  }

  .subtitle {
    display: block !important;
    margin-bottom: 10px !important;
    font-size: 1.25rem;
  }

  .subtitle i {
    transform: translateY(-3px);
  }

  .text-intro {
    font-size: 1rem;
    line-height: 1.6;
  }
}


</style>
