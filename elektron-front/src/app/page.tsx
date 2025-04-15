'use client';
import Image from 'next/image';
import React from "react";
import Chart from '@/components/chart';

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      {/* 🔝 Top Section */}
      <div className="bg-white shadow-md">
        {/* Title Bar */}
        <div className="border flex items-center justify-between px-6 py-4 border-b px-18">
          {/* Enclosing box for the title and the two items */}
          <div className="flex border border-gray border-3 items-center justify-between w-full p-4 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl text-black font-bold">Elektron ⚡</h1>
            <div className="flex items-center gap-4">
            <button className="text-xl">🔔</button>
            <Image
              src="/user-avatar.png"
              alt="User"
              width={48}
              height={48}
              className="rounded-full"
            />
            </div>
          </div>
        </div>


        {/* Navbar */}
        <div className="flex gap-4 px-6 py-4 bg-gray-100 px-20">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Dashboard
          </button>
          <button className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
            Devices
          </button>
        </div>
      </div>

      {/* Bottom Area (70% height) */}
      <div className="flex-1 overflow-y-auto p-6 px-18 bg-gray-50">
        <div className="border border-gray border-3 items-center justify-between w-full p-4 bg-white rounded-lg shadow-lg">
          <div className="h-[50vh] border-4 border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-xl px-6 py-6">
            <div className="w-[80%] h-full border border-black border-3 font-bold px-4 py-4 text-2xl hover:bg-gray-100">
              Power Visual Representation
              <Chart/>
              Chart Test
            </div>
            <div className="w-[2vh]"/>
            <div className="w-[20%] h-full border border-black border-3 font-bold px-4 py-4 text-2xl px-4 py-4">
            </div>
          </div>
          <div className="h-[2vh]"/>
          <div className="h-[20vh] border-4 border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-xl">
            2nd Main content area (charts, stats, etc.)
          </div>
        </div>
      </div>
    </div>
  );
}
