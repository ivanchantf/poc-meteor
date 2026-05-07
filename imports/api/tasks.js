// /imports/api/tasks.js
import { Mongo } from 'meteor/mongo';
import { Meteor } from "meteor/meteor";
import { MongoInternals } from 'meteor/mongo';
export const Tasks = new Mongo.Collection('tasks');

Meteor.methods({
    // /imports/api/methods.js


    async 'tasks.insert'(data, uid) {
        if (!data || !uid) {
            throw new Meteor.Error('Task data and uid are required');
        }

        const taskId = await Tasks.insertAsync({ ...data, _id:uid,createdAt: new Date() });
        console.log('Task added with ID:', uid); // Add this line

    },
    async 'tasks.update'(data) {
        if (!data._id || !data) {
            throw new Meteor.Error('Task _id and  data are required');
        }
        await Tasks.updateAsync({ _id: data._id },data)
        console.log('Task updated ID & data:', data._id, '  ', data); // Add this line
    },
    async 'tasks.remove'(id) {
        if (!id) {
            throw new Meteor.Error('Task id is required');
        }
        await Tasks.removeAsync({ _id: id });
        console.log('Task removed ID :', id); // Add this line
    },
    
    async 'tasks.read'(collectionName) {
        console.log(`tasks.read: Reading from collection: ${collectionName}`);  
            // let collectionInstance ;


        // collectionInstance = Mongo.Collection.get(collectionName)

        // if(typeof(collectionInstance) !== 'undefined' && Object.keys(collectionInstance).length > 0){
        //     // console.log('Collection instance already exists for', collectionName);
        //     // collectionInstance = Mongo.Collection.get(collectionName);
        //     console.log(`Collection instance already exists for ${collectionName}`)
        //     console.log(collectionInstance)
        // }
        // else{
        //     console.log(`Creating new collection instance for ${collectionName}`)
        //     collectionInstance = new Mongo.Collection(collectionName);
        // }
        return Tasks.find({}).fetch()
    }
});
