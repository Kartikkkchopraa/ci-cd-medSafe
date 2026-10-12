import config from "./src/config/config"
import app from "./src/app"
import connectDB from "./src/config/database"

connectDB();

app.listen(config.PORT, ()=>{
    console.log(`server running on port ${config.PORT}`);
})