'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-slate-800 text-white flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold mb-4">Kanan Enterprises</h1>
        <p className="text-xl text-slate-300 mb-8">Premium E-Commerce Platform</p>
        <Link
          href="/browse"
          className="inline-block px-8 py-4 bg-secondary text-white rounded-lg hover:bg-orange-600 font-semibold"
        >
          Shop Now
        </Link>
      </motion.div>
    </div>
  )
}
