import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from faker import Faker
from bson import ObjectId
import random

fake = Faker()

MONGO_URI = "mongodb://root:example@localhost:27017/bridgework_db?authSource=admin"

async def seed_data():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.bridgework_db

    # Clear old data first (optional)
    await db.jobs.delete_many({})
    await db.gigs.delete_many({})
    await db.volunteers.delete_many({})
    await db.users.delete_many({})
    await db.applications.delete_many({})

    print("Cleared old collections ✅")

    # Insert Users
    users = []
    for _ in range(10):
        user = {
            "name": fake.name(),
            "about_me": fake.text(max_nb_chars=100),
            "location": fake.city(),
            "rating": random.randint(1, 5),
            "phone": int(fake.msisdn()[0:10]),
            "email": fake.email(),
            "photo_b64": "",  # leave empty or random string
            "type": random.choice(["job_seeker", "job_poster"]),
            "organization": fake.company()
        }
        users.append(user)

    user_ids = await db.users.insert_many(users)
    print(f"Inserted {len(user_ids.inserted_ids)} users ✅")

    # Insert Jobs
    jobs = []
    for _ in range(10):
        job = {
            "title": fake.job(),
            "description": fake.text(max_nb_chars=150),
            "location": fake.city(),
            "points": random.randint(10, 200),
            "is_active": True,
            "created_at": fake.date_time_this_year(),
            "pay": random.randint(50000, 150000),
            "organization": fake.company(),
            "skills": fake.words(nb=5)
        }
        jobs.append(job)

    job_ids = await db.jobs.insert_many(jobs)
    print(f"Inserted {len(job_ids.inserted_ids)} jobs ✅")

    # Insert Gig Jobs
    gigs = []
    for _ in range(10):
        gig = {
            "title": fake.job(),
            "description": fake.text(max_nb_chars=150),
            "location": fake.city(),
            "points": random.randint(5, 50),
            "is_active": True,
            "created_at": fake.date_time_this_year(),
            "pay": random.randint(50, 1000),
            "organization": fake.company(),
            "skills": fake.words(nb=3),
            "duration": f"{random.randint(1, 8)} weeks"
        }
        gigs.append(gig)

    gig_ids = await db.gigs.insert_many(gigs)
    print(f"Inserted {len(gig_ids.inserted_ids)} gig jobs ✅")

    # Insert Volunteer Jobs
    volunteers = []
    for _ in range(10):
        volunteer = {
            "title": f"Volunteer {fake.job()}",
            "description": fake.text(max_nb_chars=150),
            "location": fake.city(),
            "points": random.randint(5, 30),
            "is_active": True,
            "created_at": fake.date_time_this_year(),
            "pay": 0,
            "organization": fake.company(),
            "skills": fake.words(nb=4),
        }
        volunteers.append(volunteer)

    volunteer_ids = await db.volunteers.insert_many(volunteers)
    print(f"Inserted {len(volunteer_ids.inserted_ids)} volunteer jobs ✅")

    # Insert Applications
    applications = []
    for _ in range(10):
        application = {
            "job_id": random.choice(job_ids.inserted_ids),
            "applicant": random.choice(user_ids.inserted_ids),
            "poster": random.choice(user_ids.inserted_ids),
            "active": True,
            "selected": random.choice([True, False]),
        }
        applications.append(application)

    application_ids = await db.applications.insert_many(applications)
    print(f"Inserted {len(application_ids.inserted_ids)} applications ✅")

    print("\n🎉 Seeding completed successfully!")

    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
