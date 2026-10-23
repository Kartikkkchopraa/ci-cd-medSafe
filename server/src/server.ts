import config from "./config/config.js";
import app from "./app.js"
import connectDB from "./config/database.js"

connectDB();

app.listen(config.PORT, ()=>{
    console.log(`server running on port ${config.PORT}`);
})
