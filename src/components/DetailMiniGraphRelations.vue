<template>
  <div ref="graphContainer" style="height: 500px; background: #f8f8f8; border-radius: 8px;"></div>
</template>

<script>
import {Network} from "vis-network/standalone";

export default {
  name: "MiniGraphRelations",
  props: {
    centerPerson: {type: Object, required: true},
    relations: {type: Array, required: true}
  },
  emits: ['node-clicked'],
  mounted() {
    this.drawGraph();
  },
  watch: {
    centerPerson: 'drawGraph',
    relations: 'drawGraph'
  },
  methods: {
    drawGraph() {
      const nodes = [
        {
          id: this.centerPerson._id_dil,
          label: `${this.centerPerson.firstnames} ${this.centerPerson.lastname}`,
          shape: 'ellipse',
          color: {background: '#FFC107', border: '#FFA000'},
          font: {bold: true, size: 18}
        }
      ];

      const edges = [];

      const typeColors = {
        'parrain': '#4CAF50',      // vert
        'successeur': '#2196F3',   // bleu
        'prédécesseur': '#F44336', // rouge
        'associé': '#9C27B0',       // violet
        'autre': '#9E9E9E'          // gris
      };

      this.relations.forEach(rel => {
        const typeKey = (rel.type || 'autre').toLowerCase();

        nodes.push({
          id: rel._id_dil,
          label: `${rel.firstnames} ${rel.lastname}`,
          shape: 'box',
          color: {background: typeColors[typeKey] || typeColors['autre'], border: '#555'},
          font: {color: '#fff', size: 16}
        });

        edges.push({
          from: this.centerPerson._id_dil,
          to: rel._id_dil,
          label: rel.type,
          arrows: 'to',
          font: {align: 'middle', size: 12}
        });
      });

      const data = {nodes, edges};

      const options = {
        nodes: {
          shape: 'dot',
          size: 16
        },
        edges: {
          smooth: true,
          color: {color: '#aaa'}
        },
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based', // ou 'repulsion'
          forceAtlas2Based: {
            gravitationalConstant: -80, // -50 par défaut, mets -80 pour écarter un peu plus
            centralGravity: 0.01,       // centre plus ou moins serré
            springLength: 250,          // longueur minimum des liens entre les nœuds (plus grand = plus d'écart)
            springConstant: 0.02        // force des ressorts (plus petit = plus mou, plus écarté)
          },
          stabilization: {
            iterations: 150
          }
        },
        layout: {
          improvedLayout: true
        },
        interaction: {
          hover: true,
          navigationButtons: true
        }
      };

      const network = new Network(this.$refs.graphContainer, data, options);

      // Quand on clique sur un nœud ≠ du centre
      network.on("click", (params) => {
        if (params.nodes.length > 0 && params.nodes[0] !== this.centerPerson._id_dil) {
          this.$emit('node-clicked', params.nodes[0]);
        }
      });
    }
  }
}
</script>
