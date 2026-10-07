import config from "./src/config/config"
import app from "./src/app"

app.listen(config.PORT, ()=>{
    console.log(`server running on port ${config.PORT}`);
})