
const mongoose = require('mongoose');

const uri = "mongodb+srv://natboa:OM7y1smSfbSRDAYE@design-thinking-db.gezkwx5.mongodb.net/design-thinking-bot";

async function run() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(uri);
        console.log('Connected successfully!');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections found:', collections.map(c => c.name));

        // Define a loose schema to catch whatever is there
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const user = await User.findOne({ username: 'rafi' });
        console.log('--------------------------------------------------');
        if (user) {
            console.log('✅ User "rafi" found!');
            console.log(`   Username: '${user.username}'`);
            console.log(`   Password: '${user.password}'`);
            console.log(`   IS VALID? ${user.password === '123456'}`);
            console.log(`   Length: ${user.password ? user.password.length : 0}`);
        } else {
            console.log('❌ User "rafi" NOT found.');
            const all = await User.find({});
            console.log('All usernames:', all.map(u => u.username));
        }
        console.log('--------------------------------------------------');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
