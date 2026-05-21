// /imports/api/tasks.js
import { Mongo } from 'meteor/mongo';
import { Meteor } from "meteor/meteor";
import { MongoInternals } from 'meteor/mongo';
import './offline';
export const Tasks = new Mongo.Collection('tasks');
// Explicitly tell jam:offline to track this collection
Tasks.keep()
Meteor.methods({
    async 'tasks.insert'(data, uid) {
        if (!data || !uid) {
            throw new Meteor.Error('Task data and uid are required');
        }

        const taskId = await Tasks.insertAsync({ ...data, _id:uid,createdAt: new Date() });
        console.log('Task added with ID:', taskId ); 
// CRITICAL FOR jam:offline:  must return the ID
        return taskId ;
    },
    async 'tasks.update'(data) {
        if (!data._id || !data) {
            throw new Meteor.Error('Task _id and  data are required');
        }
        console.log('tasks.update called with data:', data);
        await Tasks.updateAsync({ _id: data._id },data)
        console.log('Task updated ID & data:', data._id, '  ', data); 
        return data._id; // Return the ID of the updated task
    },
    async 'tasks.remove'(id) {
        if (!id) {
            throw new Meteor.Error('Task id is required');
        }
        await Tasks.removeAsync({ _id: id });
        console.log('Task removed ID :', id); 
    // CRITICAL FOR jam:offline: Returning the id cleanly registers deletion sync completion
            return id;
    },
    
    async 'tasks.read'(collectionName) {
        console.log(`tasks.read: Reading from collection: ${collectionName}`);  
        return Tasks.find({}).fetch();
    }
});
