import asyncio
from tapo import ApiClient


async def main():
    client = ApiClient("nishan.paudel1914@gmail.com", "")
    device = await client.p115("172.20.10.6")

    # await device.on()  # Turns the plug ON
    # await device.off()  # Turns the plug OFF
    # You can also check energy usage (if supported and online):
    for _ in range(100):
        energy_usage = await device.get_energy_usage()
        print("Energy Usage:", energy_usage.to_dict())
        await asyncio.sleep(360)


asyncio.run(main())
