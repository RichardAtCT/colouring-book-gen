import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { templates } from "./schema";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle(client);

const TEMPLATES = [
  // Animals
  {
    id: "tpl-animals-dinosaur",
    category: "animals",
    name: "Friendly Dinosaur",
    promptTemplate:
      "A friendly {type} dinosaur standing in a prehistoric landscape with palm trees and volcanoes",
    variablesJson: JSON.stringify([
      {
        name: "type",
        placeholder: "type of dinosaur",
        options: [
          "T-Rex",
          "Triceratops",
          "Brontosaurus",
          "Stegosaurus",
          "Pterodactyl",
        ],
      },
    ]),
    ageRange: "5-7" as const,
    previewUrl: null,
  },
  {
    id: "tpl-animals-cat",
    category: "animals",
    name: "Cute Cat",
    promptTemplate:
      "A cute {breed} cat {activity} in a cosy home setting",
    variablesJson: JSON.stringify([
      {
        name: "breed",
        placeholder: "breed",
        options: ["tabby", "Persian", "Siamese", "ginger"],
      },
      {
        name: "activity",
        placeholder: "activity",
        options: [
          "playing with yarn",
          "sleeping on a pillow",
          "drinking milk",
          "sitting in a window",
        ],
      },
    ]),
    ageRange: "2-4" as const,
    previewUrl: null,
  },
  {
    id: "tpl-animals-ocean",
    category: "animals",
    name: "Ocean Animals",
    promptTemplate:
      "An underwater scene with a {animal} swimming among coral reefs and seaweed",
    variablesJson: JSON.stringify([
      {
        name: "animal",
        placeholder: "sea creature",
        options: [
          "dolphin",
          "sea turtle",
          "whale",
          "octopus",
          "clown fish",
        ],
      },
    ]),
    ageRange: "5-7" as const,
    previewUrl: null,
  },
  {
    id: "tpl-animals-farm",
    category: "animals",
    name: "Farm Animals",
    promptTemplate:
      "A happy {animal} on a farm with a barn, fence, and rolling hills in the background",
    variablesJson: JSON.stringify([
      {
        name: "animal",
        placeholder: "farm animal",
        options: ["cow", "horse", "pig", "sheep", "chicken", "goat"],
      },
    ]),
    ageRange: "2-4" as const,
    previewUrl: null,
  },
  {
    id: "tpl-animals-jungle",
    category: "animals",
    name: "Jungle Safari",
    promptTemplate:
      "A {animal} in the jungle surrounded by tropical plants, vines, and exotic flowers",
    variablesJson: JSON.stringify([
      {
        name: "animal",
        placeholder: "jungle animal",
        options: ["lion", "elephant", "monkey", "giraffe", "tiger", "parrot"],
      },
    ]),
    ageRange: "5-7" as const,
    previewUrl: null,
  },
  {
    id: "tpl-animals-dog",
    category: "animals",
    name: "Pet Dog",
    promptTemplate:
      "A friendly {breed} dog {activity} in a garden with flowers",
    variablesJson: JSON.stringify([
      {
        name: "breed",
        placeholder: "breed",
        options: ["golden retriever", "dalmatian", "poodle", "husky", "corgi"],
      },
      {
        name: "activity",
        placeholder: "activity",
        options: [
          "playing fetch",
          "digging a hole",
          "chasing a butterfly",
          "sitting with a bone",
        ],
      },
    ]),
    ageRange: "2-4" as const,
    previewUrl: null,
  },

  // Space
  {
    id: "tpl-space-rocket",
    category: "space",
    name: "Rocket Ship",
    promptTemplate:
      "A large rocket ship blasting off into space with stars, planets, and clouds of smoke below",
    variablesJson: null,
    ageRange: "5-7" as const,
    previewUrl: null,
  },
  {
    id: "tpl-space-astronaut",
    category: "space",
    name: "Astronaut",
    promptTemplate:
      "A friendly astronaut {activity} on the {location} with Earth visible in the background",
    variablesJson: JSON.stringify([
      {
        name: "activity",
        placeholder: "activity",
        options: [
          "floating",
          "planting a flag",
          "exploring",
          "waving hello",
        ],
      },
      {
        name: "location",
        placeholder: "location",
        options: ["Moon", "Mars", "a space station", "an asteroid"],
      },
    ]),
    ageRange: "5-7" as const,
    previewUrl: null,
  },
  {
    id: "tpl-space-solar",
    category: "space",
    name: "Solar System",
    promptTemplate:
      "The solar system with the Sun in the centre and all the planets orbiting around it, each planet with a friendly face",
    variablesJson: null,
    ageRange: "8-12" as const,
    previewUrl: null,
  },
  {
    id: "tpl-space-aliens",
    category: "space",
    name: "Alien Friends",
    promptTemplate:
      "Friendly alien creatures having a {activity} on a colourful alien planet with unusual plants and two moons",
    variablesJson: JSON.stringify([
      {
        name: "activity",
        placeholder: "activity",
        options: ["picnic", "dance party", "tea party", "sports day"],
      },
    ]),
    ageRange: "5-7" as const,
    previewUrl: null,
  },

  // Fantasy
  {
    id: "tpl-fantasy-unicorn",
    category: "fantasy",
    name: "Unicorn",
    promptTemplate:
      "A magical unicorn with a flowing mane and tail standing in a {setting} with sparkles and rainbows",
    variablesJson: JSON.stringify([
      {
        name: "setting",
        placeholder: "setting",
        options: [
          "enchanted forest",
          "flower meadow",
          "crystal cave",
          "cloud kingdom",
        ],
      },
    ]),
    ageRange: "5-7" as const,
    previewUrl: null,
  },
  {
    id: "tpl-fantasy-dragon",
    category: "fantasy",
    name: "Dragon",
    promptTemplate:
      "A friendly baby dragon {activity} in a fantasy landscape with castles and mountains",
    variablesJson: JSON.stringify([
      {
        name: "activity",
        placeholder: "activity",
        options: [
          "learning to fly",
          "breathing small puffs of fire",
          "reading a book",
          "playing with a knight",
        ],
      },
    ]),
    ageRange: "5-7" as const,
    previewUrl: null,
  },
  {
    id: "tpl-fantasy-castle",
    category: "fantasy",
    name: "Fairy Castle",
    promptTemplate:
      "A magical fairy tale castle with towers, flags, and a drawbridge, surrounded by a moat and enchanted forest",
    variablesJson: null,
    ageRange: "8-12" as const,
    previewUrl: null,
  },
  {
    id: "tpl-fantasy-forest",
    category: "fantasy",
    name: "Magic Forest",
    promptTemplate:
      "An enchanted forest with {creatures} among giant mushrooms, glowing flowers, and twisted ancient trees",
    variablesJson: JSON.stringify([
      {
        name: "creatures",
        placeholder: "magical creatures",
        options: [
          "fairies and pixies",
          "gnomes and elves",
          "forest spirits",
          "talking animals",
        ],
      },
    ]),
    ageRange: "8-12" as const,
    previewUrl: null,
  },

  // Vehicles
  {
    id: "tpl-vehicles-firetruck",
    category: "vehicles",
    name: "Fire Truck",
    promptTemplate:
      "A big red fire truck with a ladder racing to a scene with firefighters and a fire station in the background",
    variablesJson: null,
    ageRange: "2-4" as const,
    previewUrl: null,
  },
  {
    id: "tpl-vehicles-racecar",
    category: "vehicles",
    name: "Racing Car",
    promptTemplate:
      "A speedy racing car with number {number} zooming around a race track with cheering crowds",
    variablesJson: JSON.stringify([
      {
        name: "number",
        placeholder: "car number",
        options: ["1", "7", "13", "42", "99"],
      },
    ]),
    ageRange: "5-7" as const,
    previewUrl: null,
  },
  {
    id: "tpl-vehicles-pirateship",
    category: "vehicles",
    name: "Pirate Ship",
    promptTemplate:
      "A pirate ship sailing on the ocean with {features} and a treasure island in the distance",
    variablesJson: JSON.stringify([
      {
        name: "features",
        placeholder: "features",
        options: [
          "skull and crossbones flag",
          "cannon and treasure chests",
          "a friendly pirate crew",
          "a parrot and a map",
        ],
      },
    ]),
    ageRange: "8-12" as const,
    previewUrl: null,
  },

  // Nature
  {
    id: "tpl-nature-butterfly",
    category: "nature",
    name: "Butterfly Garden",
    promptTemplate:
      "A beautiful garden full of {flowers} with butterflies of different patterns flying around",
    variablesJson: JSON.stringify([
      {
        name: "flowers",
        placeholder: "flowers",
        options: [
          "sunflowers and daisies",
          "roses and tulips",
          "wildflowers",
          "tropical flowers",
        ],
      },
    ]),
    ageRange: "5-7" as const,
    previewUrl: null,
  },
  {
    id: "tpl-nature-undersea",
    category: "nature",
    name: "Under the Sea",
    promptTemplate:
      "A detailed underwater scene with coral reefs, sea shells, starfish, jellyfish, and schools of tropical fish",
    variablesJson: null,
    ageRange: "8-12" as const,
    previewUrl: null,
  },
  {
    id: "tpl-nature-treehouse",
    category: "nature",
    name: "Treehouse",
    promptTemplate:
      "A cosy treehouse in a giant oak tree with a rope ladder, windows, and {features}",
    variablesJson: JSON.stringify([
      {
        name: "features",
        placeholder: "special features",
        options: [
          "a slide and swing",
          "a telescope and books",
          "fairy lights and bunting",
          "a zip line and bucket pulley",
        ],
      },
    ]),
    ageRange: "5-7" as const,
    previewUrl: null,
  },
];

async function seed() {
  console.log("Seeding templates...");

  for (const template of TEMPLATES) {
    await db
      .insert(templates)
      .values(template)
      .onConflictDoUpdate({
        target: templates.id,
        set: {
          name: template.name,
          promptTemplate: template.promptTemplate,
          variablesJson: template.variablesJson,
          category: template.category,
          ageRange: template.ageRange,
        },
      });
  }

  console.log(`Seeded ${TEMPLATES.length} templates.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
