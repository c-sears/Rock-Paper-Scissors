// Initialize Firebase
const config = {
    apiKey: "AIzaSyAy6P4nMkUslF4bQF0-AwAo_2FzoIiUpoQ",
    authDomain: "rockpaperscissors-79d96.firebaseapp.com",
    databaseURL: "https://rockpaperscissors-79d96.firebaseio.com",
    projectId: "rockpaperscissors-79d96",
    storageBucket: "rockpaperscissors-79d96.appspot.com",
    messagingSenderId: "611931926846"
};
firebase.initializeApp(config);
const database = firebase.database(); // root database ref
const userRef = database.ref().child('users'); // users database ref
const choicesRef = database.ref().child('game_round'); // game_round database ref
const connectedRef = database.ref('.info/connected'); // ref used to determine when user's connect/disconnect
const usersConnectedRef = database.ref('usersConnected'); // ref holding uid's of user's currently connected
const isConnected = database.ref('isConnected');
const auth = firebase.auth(); // Firebase authentication ref

let local_player_uid; // initializing variable to house the local user's uid returned when they sign in
let enemy_player_uid; // initializing variable to house the enemy user's uid returned when they sign in

let local_player_push_key; // initializing variable for push keys. Used to determine if the enemy player leaves game.
let enemy_player_push_key; 

let local_player_choice; // too much typing to say all this again.. variable for local player choice
let enemy_player_choice; // enemy player choice

let local_player_lives = 3; // give both players 3 lives
let enemy_player_lives = 3; 

// TAKE USER NAME INPUT
$('#pick_user_name').click(e => {
    userRef.once('value', snap => {  // Check to see how many players are currently playing
        if (snap.numChildren() < 2){  // If there are less than 2 the user is allowed to ready up
            let local_player_name = $('#user_name_input').val(); // collect user input
            let local_player_heading = $('#player_one_heading'); // just read the variable name
            let span = $('<span>').html(local_player_name); // creates an html span element with user input to append into the user name heading
            let start_button = $('#start_game'); // choose username button
            start_button.remove(); // removing choose username button
            local_player_heading.append(span); // update local player screen with username
            auth.signInAnonymously().catch(err => {console.log('Error: ' + err)}); // sign in the user and log any errors to the console
            local_player_uid = auth.currentUser.uid; // sets global variable
            userRef.child(local_player_uid).set({
                'user_name': local_player_name, // set player name in database
                'push_key': local_player_push_key // set player push key into database. Used to determine when player leaves
            });
        } else { // already 2 players
            alert('I\'m sorry.. but it looks like this game is full :/ try again soon!');
        }
    })
})

// UPDATE SCREEN WHEN ANOTHER PLAYER JOINS
userRef.on('child_added', snap => { // when there is a new user added to the database
    if (snap.key !== local_player_uid){ // if it is not the local user
        enemy_player_uid = snap.key; // set enemy player variable equal to the uid of the other player
        enemy_player_push_key = snap.val().push_key; // get enemy player's push key in connected ref to determine when they leave
        $('#enemy_player_username').text(snap.val().user_name); // update screen with player's username
    }
})

// UPDATE CONNECTED DATABASE WHEN USER CONNECTS/DISCONNECTS FROM APP
connectedRef.on('value', snap =>{
    if(snap.val()){
        const con = usersConnectedRef.push(true);
        local_player_push_key = con.key;
        
        con.onDisconnect().remove();
    }
})

usersConnectedRef.on('child_removed', snap =>{
    if (snap.key === enemy_player_push_key){
        database.ref().remove();
        alert('It looks like the other player disconnected.. the game will now reset.');
        window.location.reload();
    }
}) 

// isConnected.onDisconnect().set(true) 

// TAKE USER INPUT FOR ROCK/PAPER/SCISSORS
$('.attack_method').click(e => { // when the user clicks any of the attack methods
    elem = e.target;
    method = $(elem).attr('id'); // determines which method was selected
    local_player_choice = method;
    choicesRef.child(local_player_uid).set({
        'method': method // set the attack method in the database to the method the user selected
    })
    $('#local_chosen_icon').removeClass('hide'); // shows the icon indicating user has chosen
})

// UPDATE WHEN ENEMY HAS CHOSEN
choicesRef.on('child_added', snap => { // When there is a child added to the choicesRef
    if (snap.key !== local_player_uid){ // If it was not the local player's choice
        enemy_player_choice = snap.val().method; // set the enemyChoice equal to the enemy player's choice
        $('#enemy_chosen_icon').removeClass('hide'); // shows icon indicating enemy has chosen
    }
})

// CHECK WHEN BOTH PLAYERS HAVE CHOSEN
choicesRef.on('value', snap => {
    if (snap.numChildren() == 2){ // if there are 2 children then both players have made a selection
        checkRoundWinner(local_player_choice, enemy_player_choice); // calls function to determine winner (below)
    }
})

// FUNCTION THAT TAKES BOTH USER CHOICES AND DETERMINES WINNER
function checkRoundWinner(lc, ec) {
      if (lc == 'rock' && ec == 'scissors'){
          alert('You: ' + lc + '\nEnemy: ' + ec + '\nYou win this round!');
          enemy_player_lives -= 1;
      } else if (lc == 'rock' && ec == 'paper'){
          alert('You: ' + lc + '\nEnemy: ' + ec + '\nYou lost this round :/');
          local_player_lives -= 1;
      } else if (lc == 'paper' && ec == 'rock'){
          alert('You: ' + lc + '\nEnemy: ' + ec + '\nYou win this round!!');
          enemy_player_lives -= 1;
      } else if (lc == 'paper' && ec == 'scissors'){
          alert('You: ' + lc + '\nEnemy: ' + ec + '\nYou lost this round :/');
          local_player_lives -= 1;
      } else if (lc == 'scissors' && ec == 'paper'){
          alert('You: ' + lc + '\nEnemy: ' + ec + '\nYou win this round!!');
          enemy_player_lives -= 1;
      } else if (lc == 'scissors' && ec == 'rock'){
          alert('You: ' + lc + '\nEnemy: ' + ec + '\nYou lost this round :/');
          local_player_lives -= 1;
      } else if (lc == ec){
          alert('Hmm.. Seems like you both chose ' + lc + '!')
      }
      update_player_lives(); // calls function that subtracts one heart from whichever player lost (below)
      choicesRef.remove(); // This removes both player's choices from the database
      $('#local_chosen_icon').addClass('hide'); // hides the icon indicating user has chosen
      $('#enemy_chosen_icon').addClass('hide'); // hides the icon indicating user has chosen
  }
  // FUNCTION THAT UPDATES PLAYER HEARTS IN THE DOM
  function update_player_lives() {
      let local_player_hearts = $('#local_player_hearts');
      let enemy_player_hearts = $('#enemy_player_hearts');
      let heart_icon = $('<i class="fa fa-heart player_heart">') // shortcut to create a heart icon
  
      local_player_hearts.empty(); // empty all of the hearts
      enemy_player_hearts.empty();
      if (local_player_lives < 0 && enemy_player_lives < 0){
        for (let i = 0; i < local_player_lives+1; i++){ // add heart for each life of local player
            local_player_hearts.prepend(heart_icon);
        };
        for (let j = 0; j < enemy_player_lives+1; j++){ // add heart for each life of enemy player
            enemy_player_hearts.append(heart_icon);
        };
      } else if (local_player_lives == 0){
          alert('Oh no! you lost the game! :/ \nI\'m about to reload your page.. maybe you\'ll have better luck next time!');
          userRef.remove(); // empty the database for next game
          location.reload(); // reload the page
      } else if (enemy_player_lives == 0){
          alert('Congratulations!! You\'ve won the game! I\'m going to reload your page for you so you can play again!');
          userRef.remove() // empty the database for next game
          location.reload() // reload the page
      }
  }




// TODO -- take username input and update firebase/screen with chosen username -- DONE
// TODO -- check number of players to make sure there are only 2 && alert additional users the game is currently full -- DONE
// TODO -- update screen when another player joins -- DONE
// TODO -- click functions to select rock/paper/scissors -- DONE
// TODO -- update icon when user selects -- DONE
// TODO -- check when both players have chosen -- DONE
// TODO -- compare choices to determine winner -- DONE
// TODO -- deduct life from looser (remove heart icon) -- TABLED (I have absolutley zero clue why my update user lives function is not working as expected)
// TODO -- reset game-round database -- DONE
// TODO -- when either reaches 0 lives end game -- DONE
// TODO -- clear database for next users -- DONE
// TODO -- do something cool when they disconnect