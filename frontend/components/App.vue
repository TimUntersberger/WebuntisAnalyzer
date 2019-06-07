<template>
  <v-app id="app">
    <v-toolbar dense flat>
      <v-toolbar-items>
        <v-btn flat @click="analyze()">Analyze</v-btn>
        <v-btn flat @click="showLeaderboard()">Leaderboard</v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <div
      :class="{'content': true, 'content-small': ($vuetify.breakpoint.sm), 'content-extra-small': ($vuetify.breakpoint.xs)}"
    >
      <v-snackbar v-model="isSnackbarVisible">
        {{result.error}}
        <v-btn color="primary" flat @click="isSnackbarVisible = false">Close</v-btn>
      </v-snackbar>
      <v-form
        @submit="login"
        class="form"
        v-if="!this.isLeaderboardVisible && !this.isAnalyzed && !this.isLoading"
      >
        <h1>Webuntis Analyzer</h1>
        <v-text-field v-model="username" label="Username" placeholder="Username" required></v-text-field>
        <v-text-field
          v-model="password"
          label="password"
          placeholder="Password"
          required
          type="password"
        ></v-text-field>
        <v-text-field v-model="domain" label="Domain" required></v-text-field>
        <v-text-field v-model="school" label="School" required></v-text-field>
        <v-btn type="submit" color="blue">login</v-btn>
      </v-form>
      <v-progress-circular v-else-if="this.isLoading" indeterminate color="primary"></v-progress-circular>
      <div v-else-if="isLeaderboardVisible" class="leaderboard">
        <div class="leaderboard-dropdowns">
          <v-autocomplete
            class="leaderboard-dropdown"
            :items="schools"
            label="Select School"
            persistent-hint
            @change="loadLeaderboard"
            v-model="selectedSchool"
          ></v-autocomplete>
          <v-autocomplete
            class="leaderboard-dropdown"
            :items="classes"
            label="Select Class"
            persistent-hint
            @change="loadLeaderboard"
            v-model="selectedClass"
          ></v-autocomplete>
        </div>
        <v-list>
          <v-list-tile v-for="(user, index) in leaderboard" v-bind:key="index">
            <span class="leaderboard-lastname">{{index + 1}}. {{user.lastName}}</span>
            <span class="leaderboard-hours">{{user.hours}}</span>
          </v-list-tile>
        </v-list>
      </div>
      <div class="result" v-else>
        <h1>Total hours missed {{result.total}}</h1>
        <h3
          v-if="result.unexcused_absences_count"
        >{{result.unexcused_absences_count}} unexcused Absences</h3>
        <h2>Attendence</h2>
        <div class="result-subjects">
          <v-card class="card" v-for="(info, index) in result.infoPerSubject" v-bind:key="index">
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
    </v-app>
  </div>
</template>

<script lang="ts">
import WebuntisService from "../services/WebuntisService";

export default {
  name: "app",
  data() {
    return {
      isLeaderboardVisible: false,
      isSnackbarVisible: false,
      isLoading: false,
      isAnalyzed: false,
      domain: "mese.webuntis.com",
      school: "htbla linz leonding",
      username: "",
      password: "",
      result: {},
      selectedClass: null,
      selectedSchool: null,
      classes: [],
      schools: [],
      leaderboard: []
    };
  },
  methods: {
    analyze() {
      this.isLeaderboardVisible = false;
      this.isAnalyzed = false;
      this.result = {};
    },
    loadLeaderboard() {
      WebuntisService.getLeaderboard({
        className: this.selectedClass,
        school: this.selectedSchool
      }).then(result => {
        this.leaderboard = result;
      });
    },
    showLeaderboard() {
      this.isAnalyzed = false;
      this.result = {};
      WebuntisService.getClassNames().then(names => {
        this.classes = names;
      });
      WebuntisService.getSchools().then(names => {
        this.schools = names;
      });
      this.loadLeaderboard();
      this.isLeaderboardVisible = true;
    },
    login() {
      this.isLoading = true;
      WebuntisService.analyze(
        this.username,
        this.password,
        this.school,
        this.domain
      ).then(result => {
        this.result = result;
        if (!result.error) {
          this.isAnalyzed = true;
        } else {
          this.isSnackbarVisible = true;
        }
        this.password = "";
        this.isLoading = false;
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.leaderboard {
  min-width: 100%;
}
.leaderboard-dropdowns {
  display: flex;
}
.leaderboard-dropdown {
  max-width: 300px;
  &:first-child {
    margin-left: 10px;
    margin-right: 5px;
  }
  &:last-child {
    margin-left: 5px;
    margin-right: 10px;
  }
}
.leaderboard-lastname {
  font-size: 2em;
}
.leaderboard-hours {
  margin-left: auto;
}
#app {
  font-family: Roboto, "Courier New", Courier, monospace;
  height: 100vh;
  background-color: white;
}

.content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 200px;
}
.content-small {
  padding: 30px 50px;
}
.content-extra-small {
  padding: 30px 0px;
}
.form {
  width: 400px;
  height: 400px;
  padding: 10px;

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
