
import { GolferProfile, Match } from "../types/golfer";

export const mockGolfers: GolferProfile[] = [
  {
    id: "1",
    name: "Erik Svensson",
    age: 35,
    gender: "Man",
    handicap: 12.4,
    homeCourse: "Stockholms Golfklubb",
    location: "Stockholm",
    bio: "Spelar golf för att koppla av från jobbet. Söker sällskap för helgrundor.",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.0.3",
    roundTypes: ["Sällskapsrunda", "Matchspel"],
    availability: ["Helger", "Fredagar"]
  },
  {
    id: "2",
    name: "Anna Lindberg",
    age: 29,
    gender: "Kvinna",
    handicap: 8.1,
    homeCourse: "Bro Hof Slott GC",
    location: "Stockholm",
    bio: "Tävlingsinriktad golfare som söker utmaning. Är hcp 8 och vill gärna förbättras.",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3",
    roundTypes: ["Träningsrunda", "Matchspel"],
    availability: ["Kvällar", "Helger"]
  },
  {
    id: "3",
    name: "Johan Bergström",
    age: 42,
    gender: "Man",
    handicap: 18.7,
    homeCourse: "Täby GK",
    location: "Täby",
    bio: "Glad amatör som spelar för det sociala. Gillar en öl efter rundan.",
    profileImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.0.3",
    roundTypes: ["Sällskapsrunda", "Scramble"],
    availability: ["Helger"]
  },
  {
    id: "4",
    name: "Sofia Ekström",
    age: 31,
    gender: "Kvinna",
    handicap: 15.3,
    homeCourse: "Österåkers GK",
    location: "Åkersberga",
    bio: "Började spela golf för 3 år sedan och är fast! Söker spelpartners för träningsrundor.",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.0.3",
    roundTypes: ["Träningsrunda", "Sällskapsrunda"],
    availability: ["Kvällar", "Helger"]
  },
  {
    id: "5",
    name: "Lars Johansson",
    age: 55,
    gender: "Man",
    handicap: 5.2,
    homeCourse: "Kungliga Drottningholms GK",
    location: "Stockholm",
    bio: "Pensionerad med massor av tid för golf. Hjälper gärna nybörjare med tips.",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3",
    roundTypes: ["Matchspel", "Foursome", "Träningsrunda"],
    availability: ["Vardagar", "Helger"]
  }
];

export const mockMatches: Match[] = [
  {
    id: "m1",
    golferId: "currentUser",
    matchedWithId: "1",
    timestamp: Date.now() - 3600000 * 24,
    lastMessage: "Ska vi köra en runda på söndag?",
    read: true
  },
  {
    id: "m2",
    golferId: "currentUser",
    matchedWithId: "3",
    timestamp: Date.now() - 3600000 * 2,
    lastMessage: "Jag kan på lördagsmorgon",
    read: false
  }
];

export const currentUserProfile: GolferProfile = {
  id: "currentUser",
  name: "Olof Karlsson",
  age: 38,
  gender: "Man",
  handicap: 14.2,
  homeCourse: "Lidingö GK",
  location: "Lidingö",
  bio: "Glad amatör som söker nya golfkompisar.",
  profileImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.0.3",
  roundTypes: ["Sällskapsrunda", "Matchspel"],
  availability: ["Helger", "Onsdagskvällar"]
};
