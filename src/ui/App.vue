<template>
  <header>
    <h1 id="title">MyStops</h1>
  </header>
  <router-view />
</template>

<style scoped lang="scss">
@import "./assets/styles/mixins";
@import "./assets/styles/variables";

#app {
  position: relative;
  width: 100%;
  height: 100%;
}

header {
  position: absolute;

  top: 0;
  right: 0;
  left: 0;

  height: 40px + $twice-standard-spacing;

  z-index: 2;

  background-color: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid $menu-item-border-color;

  > #title {
    @include title();
    text-align: right;
  }

  @media (max-width: $sm-width - 1px) {
    top: auto;
    right: auto;
    bottom: 0;
    background-color: transparent;

    > #title {
      position: absolute;
      top: auto;
      right: auto;
      bottom: $standard-spacing;
      left: $standard-spacing;
      padding: 0;
      font-size: 20px;
      text-align: left;
    }
  }

  @media (max-width: $xs-width - 1px) {
    > #title {
      bottom: $quarter-standard-spacing;
      left: $quarter-standard-spacing;
      font-size: 16px;
    }
  }
}
</style>
