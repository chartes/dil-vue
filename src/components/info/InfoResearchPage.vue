<template>
  <div class="main-section">
    <!--<h1 class="title-h1">LE DICTIONNAIRE</h1>-->
    <div class="sub-section">
      <h1 class="title-h1">Tableau des résultats : la liste des imprimeurs lithographes</h1>
      <hr/>
      <br>
      <p class="paragraph">
        La liste alphabétique des imprimeurs lithographes s’affiche par défaut en consultation. Elle est filtrable par
        nom et/ou prénom, afin de retrouver rapidement un imprimeur.
      </p>
      <p class="paragraph">
        Chaque item peut être déplié pour afficher :
      </p>
      <ul class="info-list">
        <li>le nombre d’attestations liées à l’imprimeur (par ex. des brevets) ;</li>
        <li>un lien direct vers sa fiche détaillée ;</li>
        <li>dans le cas d’une recherche plein texte (champ "Rechercher dans les notices"), la liste des occurrences.
        </li>
      </ul>
      <h1 class="title-h1">Recherche plein texte</h1>
      <hr/>
      <br>
      <p class="paragraph">
        Le champ "Rechercher dans les notices" permet de formuler une recherche plein texte portant sur le contenu
        intégral des notices (informations personnelles et professionnelles, ainsi que brevets).
      </p>
      <p class="paragraph">
        <b>Casse</b>. La recherche est insensible à la casse : la requête <code>PIERRE</code> renvoie les occurrences
        "Pierre" et "pierre".
      </p>
      <p class="paragraph">
        <b>Chercher des mots.</b> La recherche renvoie les notices contenant au moins une fois chaque forme exacte du
        mot saisi. La requête <code>affiches images publicitaires</code> permet d’accéder aux notices contenant tous ces
        mots, quel que soit leur ordre d’apparition dans la notice.
      </p>
      <p class="paragraph attention-block"><b>Attention.</b> la recherche porte sur la forme exacte du mot. La requête <code>affiche</code>
        ne retourne pas les occurrences plurielles "affiches". Pour cela, il est possible d’utiliser une troncature.</p>
      <p class="paragraph">
        <b>Opérateurs booléens.</b> Les opérateurs booléens permettent de définir la modalité de cooccurrence de deux
        mots recherchés.
      </p>
      <ul>
        <li><code>AND</code> (par défaut) : les deux mots doivent être présents dans la notice ;</li>
        <li><code>OR</code> : un des deux mots doit être présent dans la notice ;</li>
        <li><code>NOT</code> : le premier mot doit être présent dans la notice à l’exception du second.</li>
      </ul>
      <div class="example">
        <p class="paragraph">Exemples :</p>
        <ul>
          <li><code>marchand* AND vin</code> : les mots "marchand", "marchands", etc. et "vin" sont présents dans la
            notice.
          </li>
          <li><code>opinions OR politique</code> : les mots "opinions" et/ou "politique" sont présents dans la notice.
          </li>
          <li><code>opinions NOT politique*</code> : le mot "opinions" est présent dans les notices où ne figurent pas
            les mots "politique", "politiques", etc.
          </li>
        </ul>
      </div>
      <p class="paragraph"><b>Troncature.</b> Le caractère <code>*</code> représente zéro à plusieurs caractères
        indéfinis. La requête
        <code>affich*</code> retourne les occurrences "affiche", "affiches", "affichage", "affichettes", etc.</p>
      <p class="paragraph"><b>Recherche d’expressions</b>. Inscrire les mots de la requête entre des guillemets simples
        permet de rechercher l’expression exacte. La requête <code>'service militaire'</code> permet d’accéder aux
        notices
        contenant cette expression exacte.</p>
      <h1 class="title-h1">Les facettes : filtrer les résultats</h1>
      <hr>
      <br>
      <p class="paragraph">
        Les facettes permettent de filtrer la liste des résultats selon différents critères combinables.
      </p>
      <h2 class="title-h2">Ville du brevet</h2>
      <p class="paragraph">
        Une liste déroulante avec autocomplétion permet de lister les imprimeurs actifs dans une ou différentes
        ville(s). En sélectionnant <code>Paris</code> et <code>Blois</code>, on ne liste pas les 1488 imprimeurs de
        Paris et de Blois, mais
        l’unique imprimeur (Boisgontier) actif dans sa carrière à Paris puis à Blois (puis à Paris).
      </p>
      <p class="paragraph">
        La carte des imprimeurs se met à jour selon les villes sélectionnées. Il est aussi possible de sélectionner une
        ville depuis la carte, en cliquant sur son nom.
      </p>
      <h2 class="title-h2">En activité en</h2>
      <p class="paragraph">
        Ce filtre permet de retrouver les imprimeurs actifs une <i>année</i> donnée. Par ex., <code>1828</code> permet
        de filtrer les seuls imprimeurs en activité cette année-là.
      </p>
      <!--<p class="paragraph attention-block"><b>Attention.</b> Les imprimeurs dont la date de fin d'activité est inconnue sont
        automatiquement exclus de ce filtre.</p>-->
      <h1 class="title-h1">Carte des imprimeries</h1>
      <hr/>
      <br>
      <p class="paragraph">
        La carte interactive des imprimeries met en évidence leur répartition géographique en France.
      </p>

    </div>
  </div>
</template>
<script>
export default {
  name: "ResearchPage"
}
</script>
<style scoped>

</style>