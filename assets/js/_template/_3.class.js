/*
 * Used for javascript class-like objects
 * Rank: 3
 */

// CLASS-LIKE OBJECT USED FOR PROTOTYPAL INHERITANCE WITH 'Object.create()': http://www.adobe.com/devnet/html5/articles/javascript-object-creation.html

// var Person = create(function() {

//   /*** Settings ***/

//   //indicates what is espected to be set when creating instance of this class
//   this.set({
//     name: '',
//     age: 0,
//     sport: '',
//     hasTalked: function() {} // callback function
//   });


//   /*** Private ***/

//   var race = 'human';

//   // Private function don't know 'this' so pass it along
//   function talk(that) {
//     console.log('Hello I am a ' + race + ', my name is ' + that.name + ' and I am ' + that.age + ' years old and play ' + that.sport + '.');
//     that.hasTalked();
//   }


//   /*** Public ***/

//   this.talk = function() {
//     var that = this; // allways include in public methods => insure scope of 'this'
//     talk(that); // Pass this to private function for referece to caller object
//   };
// });


// // Football player class inherit from Person
// var FootballPlayer = extend(Person, function() {

//   /*** Settings ***/

//   this.set({
//     name: '',
//     age: 0,
//     hasTalked: function() {}, // callback function
//     club: '',
//     position: ''
//   });


//   /*** Private ***/


//   /*** Public ***/

//   this.sport = 'Football';

//   this.talkAboutFootbal = function() {
//     var that = this;
//     this.talk();
//     console.log('I play as a ' + that.position + ' in ' + that.club + '.');
//   };
// });




// // Instance of FootballPalyer
// var messi = create(FootballPlayer);
// messi.set({
//   name: 'Messi',
//   age: '27',
//   club: 'Barcelona',
//   position: 'middelfielder',
//   hasTalked: function() {
//     console.log('Invoked whenever messi has talked');
//   }
// });

// messi.talkAboutFootbal();