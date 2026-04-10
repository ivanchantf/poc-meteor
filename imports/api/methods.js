// // /imports/api/methods.js
// import { Meteor } from 'meteor/meteor';
// import { Tasks } from './tasks';


// Meteor.methods({
// // /imports/api/methods.js


//     async 'tasks.insert'(text,uid) {
//     if (!text || !uid) {
//         throw new Meteor.Error('Task text , uid is required');
//     }
    
//     // const countRecords = await  Tasks.find().countAsync()+1;
//     // console.log(countRecords)
//     const taskId = await Tasks.insertAsync({ text, createdAt: new Date() ,cnt:uid});
//     console.log('Task added with ID:', uid); // Add this line

//     },
//   async 'tasks.update'(cntId, newText) {
//     if (!cntId|| !newText) {
//       throw new Meteor.Error('Task cntId and new text are required');
//     }
//     await Tasks.updateAsync({ cnt: cntId },{ $set: { text: newText } }  )
//       console.log('Task updated ID & newText:',cntId,'  ' , newText ); // Add this line
//   },
//   async 'tasks.remove'(cntId) {
//     if (!cntId) {
//       throw new Meteor.Error('Task cntId is required');
//     }
//     await Tasks.removeAsync({ cnt: cntId });
//       console.log('Task removed ID :',cntId ); // Add this line
//   },
//   async 'tasks.read'(){
//     return  Tasks.find({}).fetch()
//   }
// });