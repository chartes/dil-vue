<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-slider
          v-model="selectedYear"
          :min="1750"
          :max="1900"
          step="1"
          thumb-label
          label="Année"
          @change="fetchGraph"
        ></v-slider>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-network-graph
          :nodes="nodes"
          :edges="edges"
          :layouts="layouts"
          :options="options"
        >
          <template #node="{ node }">
  <div class="node-label">{{ node?.name || 'N/A' }}</div>
</template>
<template #edge="{ edge }">
  <div class="edge-label">{{ edge?.type || '' }}</div>
</template>
        </v-network-graph>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from 'axios'
import 'v-network-graph/lib/style.css'
import { VNetworkGraph } from 'v-network-graph'
import {mapState} from "vuex";

export default {
  name: "VisualizationView",
  components: {
    VNetworkGraph,
  },
  data() {
    return {
      selectedYear: 1800,
      nodes: {},
      edges: {},
      layouts: {
        nodes: {}
      },
      options: {
        node: {
          radius: 16,
          color: '#3f51b5',
          label: {
            visible: true,
            direction: 'center',
            color: '#fff',
            fontSize: 12,
          },
        },
        edge: {
          color: '#999',
          width: 1.5,
          marker: 'arrow',
          label: {
            visible: true,
            fontSize: 10,
            background: true,
            backgroundColor: '#fff',
            color: '#333',
          },
        },
        layout: {
          physics: false,
        },
      },
    }
  },
  computed : {
    ...mapState(["apiUrl"]),
  },
  mounted() {
    this.fetchGraph()
  },
  methods: {
    async fetchGraph() {
      try {
        const res = await axios.get(`${this.apiUrl}/graph?year=${this.selectedYear}`)
        const { nodes, edges } = res.data

        this.nodes = {}
        this.edges = {}
        this.layouts.nodes = {}

        for (const [id, n] of Object.entries(nodes)) {
          this.nodes[id] = n
          this.layouts.nodes[id] = {
            x: Math.random() * 800,
            y: Math.random() * 600
          }
        }

        for (const [id, e] of Object.entries(edges)) {
          this.edges[id] = e
        }
      } catch (err) {
        console.error("Erreur API /api/graph :", err)
      }
    }
  }
}
</script>

<style scoped>
.node-label {
  font-weight: bold;
}
.edge-label {
  font-size: 0.75rem;
  background: white;
  padding: 1px 4px;
  border-radius: 3px;
}
</style>
