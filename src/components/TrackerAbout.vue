<script setup lang="ts">
defineOptions({
  name: "TrackerAbout",
});
</script>

<template>
  <v-expansion-panels>
    <v-expansion-panel color="surface">
      <v-expansion-panel-title class="bg-primary text-on-primary">
        About
        <template v-slot:actions="{ expanded }">
          <v-icon
            :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          ></v-icon>
        </template>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <v-card flat class="mx-auto maincard-width">
          <v-card-text class="maincard-title">Origins</v-card-text>
          <p>
            This app is a descendant of one I originally built while following
            <a href="https://www.youtube.com/watch?v=hNPwdOZ3qFU"
              >one of Brad Traversy's courses</a
            >. I then made a number of upgrades which are summarized below:
          </p>
          <ul class="custom-list">
            <li>
              Tests were written and executed for the original Vue components.
            </li>
            <li>
              The props were replaced by a Pinia store, with one exception.
            </li>
            <li>Vue components were replaced by Vuetify components.</li>
            <li>Typescript checking was added.</li>
            <li>
              Some internationalization/localization was done to make monetary
              amounts appear in the correct format for the locale in which the
              app is running.
            </li>
            <li>
              A confirm dialog was added to ensure that the user really means to
              delete the transaction chosen for deletion.
            </li>
            <li>
              The AccountBalance and IncomeExpense components were merged into a
              single new component called AccountSummary.
            </li>
            <li>
              A new component called Money was created to display all instances
              of money except where it is being input or edited.
            </li>
            <li>
              A transaction date was added to the Transaction definition so that
              users could record when the income was made or the expense
              incurred. The date is now input in AddTransaction, displayed in
              TransactionHistory and DeleteTransaction, and both displayed and
              changed in UpdateTransaction.
            </li>
            <li>
              Merged the various individual Settings dialogs into a single
              tabbed Settings Dialog.
            </li>
            <li>
              Added Sentry so that errors and warnings would be properly logged,
              reassuring users and bringing issues to the attention of
              administrators.
            </li>
          </ul>
        </v-card>

        <v-card flat class="mx-auto maincard-width">
          <v-card-title class="maincard-title"
            >Major Packages Used</v-card-title
          >
          <v-row dense class="text-center">
            <v-col cols="4">
              <v-card class="pa-2 text-center h-100" elevation="2">
                <div
                  class="d-flex justify-center align-center mt-2 mx-auto logo-container"
                >
                  <img src="/vue3-logo.png" alt="Vue logo" class="logo-img" />
                </div>
                <v-card-text class="pa-0 pt-1 font-weight-medium"
                  >Vue 3</v-card-text
                >
              </v-card>
            </v-col>

            <v-col cols="4">
              <v-card class="pa-2 text-center h-100" elevation="2">
                <div
                  class="d-flex justify-center align-center mt-2 mx-auto logo-container"
                >
                  <img
                    src="/vuetify3-logo.png"
                    alt="Vuetify logo"
                    class="logo-img"
                  />
                </div>
                <v-card-text class="pa-0 pt-1 font-weight-medium"
                  >Vuetify 3</v-card-text
                >
              </v-card>
            </v-col>

            <v-col cols="4">
              <v-card class="pa-2 text-center h-100" elevation="2">
                <div
                  class="d-flex justify-center align-center mt-2 mx-auto logo-container"
                >
                  <img
                    src="/pinia-logo.png"
                    alt="Pinia logo"
                    class="logo-img"
                  />
                </div>
                <v-card-text class="pa-0 pt-1 font-weight-medium"
                  >Pinia</v-card-text
                >
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<style scoped>
.custom-list {
  list-style-type: square;
  padding-left: 30px;
  margin-top: 10px;
}
.custom-list li {
  padding-left: 10px;
  margin-bottom: 8px;
}
.maincard-title {
  color: blue;
  font-weight: 900;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.logo-container {
  width: 64px;
  height: 64px;
}

.logo-img {
  max-width: 100%;
  max-height: 100%;
}
</style>
