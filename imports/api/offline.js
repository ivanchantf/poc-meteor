import {Offline} from 'meteor/jam:offline'

Offline.configure({
  // Clear the default filter so it doesn't look for a 'deleted' flag
  autoSync: true,
  filter: {}, 
  limit: 200,
  keepAll: true // Ensures all collections are saved by default
});