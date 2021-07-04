<template>
  <Menu />
  <Search />
  <Map />
</template>

<script lang="ts">
import { defineComponent } from "vue";

import Map from "../components/Map.vue";
import Menu from "../components/Menu.vue";
import Search from "../components/Search.vue";

export default defineComponent({
  name: "Home",
  components: {
    Map,
    Menu,
    Search,
  },
});
</script>
