//dependencies
const express = require("express");
const app = express();
const request = require("request");
const Lyricist = require("lyricist");
const unirest = require("unirest");
const lyricist = new Lyricist(
  "token"
); 
const fs = require("fs");
const download = require("download");
const Discord = require("discord.js");
const client = new Discord.Client();

//glitch stuff for free hosting to work. comment out if you're running on a local machine
app.use(express.static("public"));
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

client.on("ready", () => {
  console.log("ready");
});
client.on("message", message => {
  if (message.content.startsWith("+")) {
    //slices args and command away from prefix
    const args = message.content
      .slice(1)
      .trim()
      .split(/ +/g);
    const command = args.shift().toLowerCase();
    console.log(command);
    console.log(args);
    if (command == "ping") {
         message.channel.send("Pinging...").then(msg => {
      msg.edit(
        `Pong! Response timer: ${Math.round(client.ping)} milliseconds!`
      );
    });
    }
    //plays MP3 with direct URL. finds the voicechat with the most members. mainly for trolling :D
    if (command == "play") {
      if (!args[0]) {
        message.reply("do +play [url]");
      } else {
        let guild = client.guilds.get(message.guild.id);
        setTimeout(epic => {
          console.log(args[0]);
          download(args[0]).then(data => {
            fs.writeFileSync("sound.mp3", data);
          });
          let channellist = [];
          guild.channels.forEach(channel => {
            if (channel.type == "voice") {
              channellist.push({ id: channel.id, members: 0 });
            }
          });
          let i = 0;
          channellist.forEach(thing => {
            const channel = client.channels.get(thing.id);
            if (!channel) return console.error("The channel does not exist!");
            let count = 0;
            channel.members.forEach(member => {
              count++;
            });
            channellist[i].members = count;
            console.log(
              "channel " + channel.name + " has " + count + " members"
            );
            i++;
          });
          //create array
          let arr = [];
          channellist.forEach(item => {
            arr.push(item.members);
          });
          let indexOfMax = function(arr) {
            if (arr.length === 0) {
              return -1;
            }
            var max = arr[0];
            var maxIndex = 0;
            for (var i = 1; i < arr.length; i++) {
              if (arr[i] > max) {
                maxIndex = i;
                max = arr[i];
              }
            }
            return maxIndex;
          };
          let index = indexOfMax(arr);
          let channel = client.channels.get(channellist[index].id);
          let playing = false;
          channel
            .join()
            .then(connection => {
              // Yay, it worked!
              console.log("Successfully connected to " + channel.name);
              const receiver = connection.createReceiver();
              const dispatcher = connection.playFile("./sound.mp3");
              dispatcher.on("end", end => {
                console.log("played mp3");
              });
            })
            .catch(e => {
              console.error(e);
            });
        }, 5000);
      }
    }
    
    if (command.startsWith("lyrics")) {
      try {
        console.log("lyrics request");
        var id = "";
        request(
          `https://api.genius.com/search?q=${args.join(
            " "
          )}&access_token=geniustoken`,
          function(error, response, body) {
              body = JSON.parse(body);
            
              console.log(body.response.hits[0].result.id);
              id = body.response.hits[0].result.id;
          }
        );
        try {
          setTimeout(dostuff => {
            console.log(id);
            lyricist.song(id, { fetchLyrics: true }).then(song => {
              let lyricarr = song.lyrics.match(/.{1,1500}/g);
              lyricarr.forEach(lyric => {
                message.channel.send(lyric);
              });
            });
          }, 1000);
        } catch (e) {
          message.reply("error");
        }
      } catch (e) {
        message.reply("error");
      }
    }
    if (command == "say") {
      message.channel.send(args.join(" "));

      message.delete(1);
    } else if (command == "fortune") {
      message.reply("Getting fortune");
      unirest
        .get("http://yerkee.com/api/fortune/")
        .header("Accept", "application/json")
        .end(function(result) {
          if (result.status == 200) {
            message.channel.send(result.body.fortune);
          } else {
            console.log("fetch failed");
            message.channel.send("I honestly don't know :neutral_face:");
          }
        });
    }
    else if (command == "help") {
      message.channel.send({
        embed: {
          color: 0x2df00f,
          title: "Help Command",
          description: `Info on all the commands thotbot has to offer`,
          fields: [
            {
              name: "+ping",
              value: "Pings bot and checks response time"
            },
            {
              name: "+fortune",
              value: "Gives you cool fortune"
            },
            {
              name: "+lyrics",
              value: "Gives you cool lyrics to song"
            },
            {
              name: "+taco",
              value: "gives u cool taco"
            },
            {
              name: "+poll [content of poll]",
              value: "make cool poll"
            },
            {
              name: "+someone [is a very cool person/any phrase to vote on]",
              value: "lets you vote on a random person "
            },
            {
              name: "+urban [word]",
              value: "searches up a word on urban dictionary"
            }
          ]
        }
      });
    } else if (command == "taco") {
      unirest
        .get("http://taco-randomizer.herokuapp.com/random/")
        .header("Accept", "application/json")
        .end(function(result) {
          if (result.status == 200) {
            message.channel.send(
              "```Here ur taco: \n" +
                result.body.base_layer.recipe +
                "\n full recipe at " +
                result.body.base_layer.url +
                "```"
            );
          } else {
            console.log("fetch failed");
          }
        });
    } else if (command == "poll") {
      message.channel
        .send("New Poll, Created by " + message.author + "\n " + args.join(" "))
        .then(msg => {
          msg.react("👍");
          setTimeout(next => {
            msg.react("👎");
          }, 500); //add a delay to the second reaction for the illusion that bot is a person
        });
    } else if (command == "someone") {
      let members = [];
      message.guild.members.forEach(member => {
        if (!member.bot) {
          members.push(member);
        }
      });
      let randmember = members[Math.floor(Math.random() * members.length)];
      console.log(randmember);
      message.channel.send("bro i choose " + randmember.user.tag).then(msg => {
        msg.react("👍");
        setTimeout(next => {
          msg.react("👎");
        }, 500); //add a delay to the second reaction for the illusion that bot is a person
      });
    } else if (command == "urban") {
      message.channel.send("Getting definition...").then(msg => {
        var req = unirest(
          "GET",
          "https://mashape-community-urban-dictionary.p.rapidapi.com/define"
        );

        req.query({
          term: args[0]
        });

        req.headers({
          "x-rapidapi-host":
            "mashape-community-urban-dictionary.p.rapidapi.com",
          "x-rapidapi-key": ""
        });

        req.end(function(res) {
          if (res.status == "200") {
            console.log(res.body.list);
            if (res.body.list != []) {
              let result = res.body.list[0];

              msg.edit({
                embed: {
                  color: 0x2df00f,
                  title: "Defining word " + args.join(" "),
                  description: `All definitions on https://${args.join(
                    " "
                  )}.urbanup.com`,
                  fields: [
                    {
                      name: "Word Definition",
                      value: result.definition.substring(0, 1023)
                    },
                    {
                      name: "Word Example",
                      value: result.example.substring(0, 1023)
                    },
                    {
                      name: "Stats",
                      value: `Definition written by ${
                        result.author
                      } and has obtained ${result.thumbs_up.toString()} upvotes and ${result.thumbs_down.toString()} downvotes.`
                    },
                    {
                      name: "Links",
                      value: `Definition can be found at ${result.permalink}`
                    }
                  ]
                }
              });
            } else {
              msg.edit("No Definition Found");
            }
          } else {
            message.reply("No Definition Found");
          }
        });
      });
    }
  }
});

client.login(
  "discordtoken"
);
