<template>
  <div id="app">
    <v-snackbar v-model="isSnackbarVisible">
      {{result.error}}
      <v-btn color="primary" flat @click="isSnackbarVisible = false">Close</v-btn>
    </v-snackbar>
    <v-form @submit="login" class="form" v-if="!this.isAnalyzed && !this.isLoading">
      <h1>Webuntis Analyzer</h1>
      <v-text-field v-model="username" label="Username" placeholder="Username" required></v-text-field>
      <v-text-field
        v-model="password"
        label="password"
        placeholder="Password"
        required
        type="password"
      ></v-text-field>
      <v-btn type="submit" color="blue">login</v-btn>
    </v-form>
    <v-progress-circular v-else-if="this.isLoading" indeterminate color="primary"></v-progress-circular>
    <div class="result" v-else>
      <h1>Total hours missed {{result.total}}</h1>
      <h3>{{result.unexcused_absences_count}} unexcused Absences</h3>
      <h2>Attendence</h2>
      <div class="result-subjects">
        <v-card class="card" v-for="info in result.infoPerSubject">
          <h3>{{info.subject.name}}</h3>
          <p></p>
          <v-progress-circular
            :value="100 - info.percentage"
            :size="100"
            color="blue-grey"
          >{{100 - info.percentage}}</v-progress-circular>
          <p>{{info.count}} hours missed</p>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import AnalyzerService from "../services/AnalyzerService";

export default {
  name: "app",
  data() {
    return {
      isSnackbarVisible: false,
      isLoading: false,
      isAnalyzed: false,
      username: "",
      password: "",
      result: {}
    };
  },
  methods: {
    login() {
      this.isLoading = true;
      AnalyzerService.analyze(this.username, this.password).then(result => {
        this.result = result;
        if (!result.error) {
          this.isAnalyzed = true;
        } else {
          this.isSnackbarVisible = true;
        }
        this.isLoading = false;
      });
    }
  }
};
</script>

<style lang="scss">
#app {
  font-family: Roboto, "Courier New", Courier, monospace;
  height: 100vh;
  padding: 30px 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.form {
  width: 400px;
  height: 400px;

  h1 {
    margin-bottom: 60px;
    text-align: center;
  }
}
.result {
  width: 100%;
  height: 100%;

  h1,
  h3 {
    text-align: center;
  }

  h2 {
    padding-left: 40px;
  }
}
.result-subjects {
  width: 100%;
  height: 80vh;
  margin-top: 10px;
  overflow-y: scroll;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
}
.card {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin: 20px;
  padding: 20px;

  p {
    margin-top: 20px;
  }
}
</style>