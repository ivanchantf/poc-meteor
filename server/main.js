import { Meteor } from 'meteor/meteor';

// import { Tasks } from '../imports/api/tasks';
import '../imports/api/tasksPublications';
import '../imports/api/methods';
import dotenv from 'dotenv';
import '../offline';
import { Mongo, MongoInternals } from 'meteor/mongo';
import { logToFileByDate } from './util';

const remoteUrl = "mongodb://192.168.75.51:27017/test";
let remoteDriver = new MongoInternals.RemoteCollectionDriver(remoteUrl);
export const TasksRemote = new Mongo.Collection("tasks_remote", {
  _driver: remoteDriver
})

const DynamicCollections = {};


Meteor.startup(async () => {



  Meteor.publish("tasks_remote", () => {
    return TasksRemote.find();
  });

  Meteor.methods({

    async 'tasksRemote.insert'(data, uid) {
        if (!data || !uid) {
            throw new Meteor.Error('Task data and uid are required');
        }
        //   let collectionRemoteInstance ;
        // if(Mongo.Collection.get(collectionRemoteName)){
        //     collectionRemoteInstance = Mongo.Collection.get(collectionRemoteName);
        // }
        // else{
        //   console.log(`Creating new remote collection instance for ${collectionRemoteName}`)
        //     collectionRemoteInstance = new Mongo.Collection(collectionRemoteName, { _driver: remoteDriver });
        // }


        // const countRecords = await  Tasks.find().countAsync()+1;
        // console.log(countRecords)
        const taskId = await TasksRemote.insertAsync({ ...data,  _id:uid,createdAt: new Date() });
        console.log('TaskRemote added with ID:', uid); // Add this line

    },



    async 'tasksRemote.update'(data) {
              if (!data._id || !data) {
                  throw new Meteor.Error('Task _id and data are required');
              }
              await TasksRemote.updateAsync({ _id: data._id }, data)
              console.log('TaskRemote updated ID & data:', data._id, '  ', data); // Add this line
    },


    async 'tasksRemote.remove'(id) {
      if (!id) {
        throw new Meteor.Error('Task id is required');
      }
      await TasksRemote.removeAsync({ _id: id });
      console.log('TaskRemote removed ID :', id); // Add this line
    },


    async 'tasksRemote.read'() {
      // console.log(`tasksRemote.read: Reading from remote collection: ${collectionRemoteName}`);
      //     let collectionRemoteInstance ;
      //     collectionRemoteInstance = MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection(collectionRemoteName);
      //   if(typeof(collectionRemoteInstance) !=='undefined' && Object.keys(collectionRemoteInstance).length > 0){
      //       console.log(`Collection instance already exists for ${collectionRemoteName}`)
      //       console.log(collectionRemoteInstance)
      //   }
      //   else{
      //     console.log(`Creating new remote collection instance for ${collectionRemoteName}`)
      //       collectionRemoteInstance = new Mongo.Collection(collectionRemoteName, { _driver: remoteDriver });
      //   }
      return TasksRemote.find({}).fetch()
    },


    async 'tasksExternal.insert'(messageObj) {
      console.log('In tasksExternal.insert, received messageObj:', messageObj);
      fetch(messageObj.path, { method: messageObj.httpType, body: JSON.stringify(messageObj.data), headers: { 'Content-Type': 'application/json' } })
        .then(response => response.json())
        .then(data => {
          console.log('Data insert to pwa-backend:', data);
        })
        .catch(error => {
          console.error('Error insert to pwa-backend:', error);
          logToFileByDate(error, `Error insert to pwa-backend: - Path: ${messageObj.path}`);
        });

    },

    async 'tasksExternal.update'(messageObj) {
      console.log('In tasksExternal.update, received messageObj:', messageObj);
      fetch(messageObj.path, { method: messageObj.httpType, body: JSON.stringify(messageObj.data), headers: { 'Content-Type': 'application/json' } })
        .then(response => response.json())
        .then(data => {
          console.log('Data UPDATE in pwa-backend:', data);
        })
        .catch(error => {
          console.error('Error UPDATE in pwa-backend:', error);
          logToFileByDate(error, `Error UPDATE in pwa-backend: - Path: ${messageObj.path}`);
        });

    },
    async 'tasksExternal.remove'(messageObj) {
      console.log('In tasksExternal.remove, received messageObj:', messageObj);
      fetch(messageObj.path, { method: messageObj.httpType, body: JSON.stringify(messageObj.data), headers: { 'Content-Type': 'application/json' } })
        .then(response => response.json())
        .then(data => {
          console.log('Data DELETE in pwa-backend:', data);
        })
        .catch(error => {
          console.error('Error DELETE in pwa-backend:', error);
          logToFileByDate(error, `Error DELETE in pwa-backend: ${messageObj.path}`);
        });

    },
    async 'tasksExternal.read'(messageObj) {
      console.log('In tasksExternal.read, received messageObj:', messageObj);

      return fetch(messageObj.path, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json(); // Pass the parsed JSON to the next .then()
        })
        .then(data => {
          console.log('Data fetched successfully:', data);
          return data; // This becomes the final result of the Method
        })
        .catch(error => {

          logToFileByDate(error, `tasksExternal.read - Path: ${messageObj.path}`);
          console.error('Error fetching data from pwa-backend:', error);
        });
    }
  })


});
