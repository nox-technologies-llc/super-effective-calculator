import Axios, { AxiosError, AxiosResponse } from "axios";
import { castNativePokemonToPokemonType } from "../../functions/util/cast";
import { filterDuplicates } from "../../functions/util/filter";
import { mergeSort } from "../../functions/util/sort";
import { NativePokemonType, PartialSECPokemon, PokemonType, SECPokemonRecord } from "../../types/pokemon.types";

export const getPokemonByName = async (name: string): Promise<any | undefined> => {
  const response = await Axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`)
  const { data } = response;
  return data
}

export const getDamageRelationsFromTypeName = async (name: string): Promise<any> => {
  const response = await Axios.get(`https://pokeapi.co/api/v2/type/${name}`)
  const { data } = response;
  return data;
}

export const getWeaknessesByTypes = async (types: NativePokemonType[]): Promise<PokemonType[]> => {
  let weaknesses: PokemonType[] = [];
  let strengths: PokemonType[] = [];

  const result = types.map(async (type) => {
    const data = await getDamageRelationsFromTypeName(type.type.name);

    const {
      double_damage_from,
      half_damage_from,
    } = data.damage_relations;

    weaknesses.push(...double_damage_from);
    strengths.push(...half_damage_from);
  });

  await Promise.all(result);

  weaknesses = mergeSort(weaknesses).filter((type, idx, arr) => filterDuplicates(type, idx, arr));
  strengths = mergeSort(strengths).filter((type, idx, arr) => filterDuplicates(type, idx, arr));

  weaknesses = weaknesses.filter((type) => {
    return !strengths.find((element) => {
      return element.name === type.name;
    })
  });

  return weaknesses;
}

// TODO needs error handling
export const getSECPokemon = async (term: string) => {

  const { 
    id, 
    name, 
    sprites, 
    weight, 
    types 
  }: PartialSECPokemon = await getPokemonByName(term);
  const weakAgainst = await getWeaknessesByTypes(types);

  const pokemon: SECPokemonRecord = {
    id,
    name,
    weight,
    sprite: sprites.front_default,
    types: castNativePokemonToPokemonType(types),
    weakAgainst
  };

  return pokemon;
};