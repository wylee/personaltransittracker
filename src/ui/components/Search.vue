<template>
  <div id="search">
    <form @submit.prevent="() => search()">
      <input
        type="text"
        title="Enter a stop ID or name"
        placeholder="Enter a stop ID or name"
        autofocus
        v-model="term"
      />

      <button
        type="submit"
        title="Search"
        class="material-icons"
        :disabled="!(term.trim() || error)"
      >
        search
      </button>

      <button
        type="reset"
        title="Clear"
        class="material-icons"
        @click="reset"
        :disabled="!term"
      >
        close
      </button>
    </form>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { mapState } from "vuex";

export default defineComponent({
  name: "Search",
  data() {
    return {
      internalTerm: null,
    };
  },
  computed: {
    term: {
      get() {
        return this.internalTerm ?? this.$store.state.term;
      },
      set(value) {
        if (!value) {
          this.reset();
        } else {
          this.internalTerm = value;
        }
      },
    },
    ...mapState(["error"]),
  },
  methods: {
    search() {
      // XXX: The search action will re-set the search term, which will
      //      cause the internal term here to be re-set too.
      const term = this.term;
      this.internalTerm = null;
      this.$store.dispatch("search", { term });
    },
    reset() {
      this.internalTerm = null;
      this.$store.commit("resetSearchState");
    },
  },
});
</script>

<style scoped lang="scss">
@import "../assets/styles/animations";
@import "../assets/styles/mixins";
@import "../assets/styles/variables";

#search {
  position: absolute;
  width: $panel-width;
  z-index: 3;

  form {
    @include floating-element();

    position: absolute;
    top: $standard-spacing;
    left: $standard-spacing;
    width: $panel-width - $twice-standard-spacing;
    z-index: 1;

    display: flex;
    flex-direction: row;
    margin: 0;
    padding: 0;

    background-color: white;

    input {
      border: none;
      flex: 1;
      font-size: 16px;
      line-height: 22px;
      height: 40px;
      min-width: 10em;
      outline: 0;
      margin: 0;
      padding: 0 $quarter-standard-spacing 0 (32px + $half-standard-spacing);

      @media (max-width: $xs-width - 1px) {
        font-size: 14px;
      }
    }

    span {
      color: gray;
      font-size: 22px;
      line-height: 1;
      margin: $half-standard-spacing 0;
    }

    @media (max-width: $xs-width - 1px) {
      top: $quarter-standard-spacing;
      left: $quarter-standard-spacing;
      right: $quarter-standard-spacing;
      width: auto;
    }
  }

  ul {
    list-style: none;
    margin: 0;
    padding-left: 0;
  }

  #result {
    animation: fade-in 0.75s;
    max-height: 400px;
    overflow-x: hidden;
  }

  ul.stops {
    background-color: white;
    box-shadow: 2px 2px 4px;
    padding-top: 40px + $twice-standard-spacing;

    position: absolute;
    top: 0;
    right: 0;
    left: 0;

    > li.updateTime {
      border-top: 1px solid $menu-item-border-color;
      padding: $half-standard-spacing $standard-spacing;
      text-align: right;
    }

    > li.stop {
      > .heading {
        background-color: #e0e0e0;
        border-top: 1px solid #a0a0a0;
        border-bottom: 1px solid #a0a0a0;
        font-size: 105%;
        font-weight: bold;
        padding: $half-standard-spacing $standard-spacing;
      }

      > ul.routes {
        > li.route {
          border-bottom: 1px solid $menu-item-border-color;
          padding: $half-standard-spacing $standard-spacing;

          &:last-child {
            border-bottom: none;
          }

          > .heading {
            font-weight: bold;
          }

          > ul.arrivals {
            > li.arrival {
              display: flex;
              flex-direction: row;
              padding: $quarter-standard-spacing 0;
              > div {
                flex: 50%;
              }
            }
          }
        }
      }
    }

    @media (max-width: $xs-width - 1) {
      padding-top: 40px + $half-standard-spacing;
      width: 100%;
    }
  }

  @media (max-width: $xs-width - 1px) {
    width: 100%;
  }
}
</style>
