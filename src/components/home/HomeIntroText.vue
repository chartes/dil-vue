<template>
  <v-row class="home-container d-flex justify-start">
    <v-col cols="12" md="6" class="left-section">
      <div class="intro-block">
        <h3 class="my-2 subtitle d-flex align-center">
          <v-icon class="mr-2" color="var(--light-brown-alt)">mdi-book-open-page-variant</v-icon>
          Une technique révolutionnaire sous surveillance
        </h3>

        <p class="text-intro">En 1817, dans l’arsenal de surveillance des métiers du livre apparaît un brevet
          d’imprimeur-lithographe sans lequel nul ne peut exploiter la lithographie, cette nouvelle technique
          d’impression, inventée vingt ans plus tôt en Allemagne. Sage précaution qui permet aux régimes successifs
          d'empêcher que ce procédé rapide et peu cher ne profite à l'estampe politique. La lithographie n'en connaît
          pas moins un très grand essor, tant elle répond, par la multiplicité de ses utilisations, aux besoins d'un
          siècle de transformations économiques et sociales profondes. Bien plus que l’illustration des livres et les
          publications satiriques, ce sont donc les travaux de ville (papiers à en-tête, faire-part, lettres de
          voiture....) et la publicité commerciale (affiches, emballages illustrés, étiquettes …), les impressions
          administratives et judiciaires, les dessins techniques et cartographiques, les décors d'objets (éventails,
          abat-jours, écrans de cheminée, jouets...) dont la consommation se démocratise, qui, pendant longtemps, font
          tourner les presses lithographiques.
        </p>
      </div>
    </v-col>
    <v-col cols="12" md="6" class="right-section">
      <div class="intro-block">
        <h3 class="my-2 subtitle d-flex align-center">
          <v-icon class="mr-2" color="var(--light-brown-alt)">mdi-magnify</v-icon>
          Un dictionnaire pour l’histoire des imprimeurs-lithographes
        </h3>
        <p class="text-intro">

          Derrière l’énorme production lithographique du XIXe siècle, il y a tout un monde d’imprimeurs spécialisés que
          ce Dictionnaire se propose de faire connaître à partir du dépouillement des dossiers constitués pour
          l’obtention du brevet d’imprimeur-lithographe et, après 1870, des simples déclarations d’activité. Les
          éléments fournis par ces documents déposés aux Archives nationales ont été complétés d’informations puisées à
          d’autres sources : correspondances, dossiers de faillite, brevets d’invention, archives notariales, sources
          policières, collections d’estampes et de livres déposés à la Bibliothèque nationale de France et dans de
          nombreuses autres institutions. Aux imprimeurs-lithographes parisiens recensés par Corinne Bouquin en
          prolongement de sa thèse de doctorat dirigée par Henri-Jean Martin et consacrée à l'imprimeur Lemercier, sont
          venus s’ajouter leurs confrères de province, pour former un corpus de plus de 5 000 noms.

          Chacune des notices rassemble données personnelles (origine sociale et géographique, formation…) et
          professionnelles (carrière, faillites et déboires judiciaires, production…), complétées de références
          bibliographiques et iconographiques. La base est, par ailleurs, consultable dans son ensemble pour des
          recherches statistiques ou sérielles.

          La conception de ce Dictionnaire s’est inscrite dans le cadre d’une réflexion menée au sein du Labex CAP et
          consacrée à l’évolution des techniques de reproduction et à leur influence sur la transmission du patrimoine
          visuel.
        </p>
      </div>
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
  align-items: center;
}

.text-intro {
  font-size: 1.2rem;
  line-height: 1.7;
}
</style>
