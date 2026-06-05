import { Mongo } from 'meteor/mongo';
import { Meteor } from "meteor/meteor";
import { MongoInternals } from 'meteor/mongo';
import './offline';
export const Tasks = new Mongo.Collection('tasks');
// Explicitly tell jam:offline to track this collection
Tasks.keep()
Meteor.methods({
    async 'tasks.insert'(data,deviceId) {
        console.log('tasks.insert method called with data:', data, 'and deviceId:', deviceId);
        if (!data ) {
            throw new Meteor.Error('Task data is required');
        }
        const taskId = await Tasks.insertAsync({ ...data, deviceId:deviceId });//, _id:uid
        return taskId ;// CRITICAL FOR jam:offline:  must return the ID
    },
    async 'tasks.update'(data,deviceId) {
        if (!data._id || !data) {
            throw new Meteor.Error('Task _id and  data are required');
        }
        else{
            console.log('tasks.update method called with data:', data, 'and deviceId:', deviceId);
        }
        await Tasks.updateAsync({ _id: data._id },{...data, deviceId:deviceId})
        return data._id; // Return the ID of the updated task
    },
    async 'tasks.remove'(id,deviceId) {
        if (!id) {
            throw new Meteor.Error('Task id is required');
        }
        await Tasks.removeAsync({ _id: id, deviceId:deviceId });
            return id;// CRITICAL FOR jam:offline: Returning the id cleanly registers deletion sync completion
    },
    
    async 'tasks.read'() {
        return Tasks.find({}).fetch();
    }
});
