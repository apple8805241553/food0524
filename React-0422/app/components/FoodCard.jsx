// 這個FoodCard不要用!!!!!
// 但他有做收藏的判斷功能了可參考這部分就好

'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaHeart, FaRegHeart } from 'react-icons/fa'

/**
 * FoodCard component for displaying food items in a grid
 * @param {Object} props - Component props
 * @param {Object} props.food - Food item data
 * @param {string} props.food.id - Food item ID
 * @param {string} props.food.title - Food item title
 * @param {string} props.food.description - Food item description
 * @param {string} props.food.image - Food item image URL
 * @param {string} props.className - Additional CSS class
 */
const FoodCard = ({ food, className = '' }) => {
  const [isFavorite, setIsFavorite] = useState(false)

  const toggleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  return (
    <Link href={`/products/${food.id}`}>
      <div className={`${className}`}>
        <div className="relative">
          <div className="aspect-[1.81] w-full">
            <Image
              src={food.image}
              alt={food.title}
              width={320}
              height={177}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={toggleFavorite}
            className="absolute z-10 right-3 top-3"
            aria-label={
              isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
          >
            {isFavorite ? (
              <FaHeart size={24} className="text-[#DF6C2D]" />
            ) : (
              <FaRegHeart size={24} className="text-[#DF6C2D]" />
            )}
          </button>
        </div>
        <div className="p-6 text-center">
          <h3 className="text-[#423C3A] text-xl font-bold line-clamp-2">
            {food.title}
          </h3>
          <p className="text-[#7A7A7A] text-base mt-4 line-clamp-2">
            {food.description}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default FoodCard
