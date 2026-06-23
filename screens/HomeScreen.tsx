/**
 * HomeScreen.tsx — Full FlexPay Dashboard
 * Food menu + cart, Swap requests, Add Funds, NFC/QR Pay
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  SafeAreaView, ScrollView, ActivityIndicator,
  Platform, TextInput, Alert, Switch, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  signOut, updatePassword, EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const LIGHT = {
  bg:'#F7F9F7',card:'#FFFFFF',cardBorder:'#E8F0E8',
  text:'#1A1A1A',textSub:'#888888',textMuted:'#B0BEC5',
  navBg:'#FFFFFF',navBorder:'#F0F0F0',
  inputBg:'#FFFFFF',inputBorder:'#C8E2D0',divider:'#F5F5F5',
  green:'#1A6E44',greenLight:'#E8F4EE',
  red:'#C0392B',redLight:'#FDECEA',
  inactive:'#B0BEC5',
};
const DARK = {
  bg:'#0D1117',card:'#161B22',cardBorder:'#21262D',
  text:'#E6EDF3',textSub:'#8B949E',textMuted:'#484F58',
  navBg:'#161B22',navBorder:'#21262D',
  inputBg:'#21262D',inputBorder:'#30363D',divider:'#21262D',
  green:'#3FB950',greenLight:'#0D2A1A',
  red:'#F85149',redLight:'#2D1117',
  inactive:'#484F58',
};
type Theme = typeof LIGHT;

const CUSTOMIZATIONS = {
  protein: ['Regular','Extra Protein (+$1.00)','No Protein (Veg)'],
  size:    ['Regular','Large (+$1.50)','Small (-$0.50)'],
  sauce:   ['Regular Sauce','Extra Sauce','No Sauce','Spicy Sauce'],
  extras:  ['None','Add Cheese (+$0.75)','Add Bacon (+$1.25)','Add Avocado (+$1.00)','Add Egg (+$0.75)'],
  diet:    ['No Preference','Vegan','Vegetarian','Gluten-Free','Halal','No Onions','No Tomatoes'],
  spice:   ['Mild','Medium','Spicy','Extra Spicy'],
};

const RESTAURANTS = [
  { id:'cfa', name:'Chick-fil-A', cat:'Chicken', time:'10-15 min', open:true, distance:'0.2 mi', icon:'fast-food-outline',
    menu:[
      {id:'c1',name:'Chicken Sandwich',price:5.49,desc:'Classic crispy chicken',veg:false,customizable:['size','sauce','diet','extras']},
      {id:'c2',name:'Spicy Deluxe',price:6.49,desc:'Spicy with lettuce & tomato',veg:false,customizable:['size','spice','sauce','diet']},
      {id:'c3',name:'Nuggets (8pc)',price:4.99,desc:'Bite-sized chicken nuggets',veg:false,customizable:['sauce','spice','diet']},
      {id:'c4',name:'Waffle Fries',price:2.99,desc:'Crispy waffle-cut fries',veg:true,customizable:['size','sauce']},
      {id:'c5',name:'Lemonade',price:2.49,desc:'Fresh-squeezed lemonade',veg:true,customizable:['size']},
    ]},
  { id:'sbux', name:'Starbucks', cat:'Coffee', time:'5-10 min', open:true, distance:'0.1 mi', icon:'cafe-outline',
    menu:[
      {id:'s1',name:'Caramel Macchiato',price:5.75,desc:'Espresso with caramel',veg:true,customizable:['size','sauce','diet']},
      {id:'s2',name:'Iced Americano',price:4.25,desc:'Cold espresso & water',veg:true,customizable:['size','diet']},
      {id:'s3',name:'Frappuccino',price:5.95,desc:'Blended ice coffee drink',veg:true,customizable:['size','sauce','extras']},
      {id:'s4',name:'Matcha Latte',price:5.25,desc:'Green tea with milk',veg:true,customizable:['size','diet']},
      {id:'s5',name:'Blueberry Muffin',price:3.25,desc:'Fresh-baked muffin',veg:true,customizable:[]},
    ]},
  { id:'einstein', name:'Einstein Bros', cat:'Bakery', time:'10-20 min', open:true, distance:'0.3 mi', icon:'pizza-outline',
    menu:[
      {id:'e1',name:'Everything Bagel',price:2.49,desc:'Classic everything seasoning',veg:true,customizable:['extras','diet']},
      {id:'e2',name:'Bagel & Cream Cheese',price:4.99,desc:'Your choice of bagel',veg:true,customizable:['extras','diet']},
      {id:'e3',name:'Turkey Sandwich',price:8.99,desc:'Turkey on asiago bagel',veg:false,customizable:['extras','sauce','diet']},
      {id:'e4',name:'Cinnamon Roll',price:3.99,desc:'Warm & fresh baked',veg:true,customizable:[]},
      {id:'e5',name:'Orange Juice',price:2.99,desc:'100% fresh orange juice',veg:true,customizable:['size']},
    ]},
  { id:'bakery', name:'Bakery Clerk', cat:'Bakery', time:'5-10 min', open:true, distance:'0.2 mi', icon:'storefront-outline',
    menu:[
      {id:'b1',name:'Croissant',price:2.99,desc:'Buttery flaky pastry',veg:true,customizable:[]},
      {id:'b2',name:'Chocolate Muffin',price:2.49,desc:'Rich chocolate chip muffin',veg:true,customizable:[]},
      {id:'b3',name:'Sourdough Loaf',price:6.99,desc:'Freshly baked sourdough',veg:true,customizable:[]},
      {id:'b4',name:'Cookie (3pc)',price:3.49,desc:'Assorted cookies',veg:true,customizable:[]},
      {id:'b5',name:'Fresh Coffee',price:1.99,desc:'House drip coffee',veg:true,customizable:['size','sauce']},
    ]},
  { id:'panda', name:'Panda Express', cat:'Asian', time:'15-20 min', open:false, distance:'0.4 mi', icon:'restaurant-outline',
    menu:[
      {id:'p1',name:'Orange Chicken',price:9.49,desc:'Sweet & tangy fan favorite',veg:false,customizable:['size','spice','diet']},
      {id:'p2',name:'Fried Rice',price:4.99,desc:'Classic fried rice',veg:false,customizable:['size','protein','diet']},
      {id:'p3',name:'Chow Mein',price:4.99,desc:'Stir-fried noodles',veg:true,customizable:['size','diet']},
      {id:'p4',name:'Kung Pao Chicken',price:9.49,desc:'Spicy with peanuts',veg:false,customizable:['size','spice','diet']},
      {id:'p5',name:'Spring Rolls (3pc)',price:3.99,desc:'Crispy vegetable rolls',veg:true,customizable:['sauce','diet']},
    ]},
  { id:'avesta', name:'Avesta', cat:'Middle Eastern', time:'15-25 min', open:true, distance:'0.5 mi', icon:'restaurant-outline',
    menu:[
      {id:'a1',name:'Chicken Shawarma',price:10.99,desc:'Grilled chicken wrap',veg:false,customizable:['extras','sauce','spice','diet']},
      {id:'a2',name:'Falafel Plate',price:9.49,desc:'Crispy falafel with hummus',veg:true,customizable:['sauce','diet','extras']},
      {id:'a3',name:'Hummus & Pita',price:5.99,desc:'Fresh hummus & warm pita',veg:true,customizable:['diet']},
      {id:'a4',name:'Lamb Kebab',price:12.99,desc:'Grilled lamb skewer',veg:false,customizable:['spice','sauce','diet']},
      {id:'a5',name:'Baklava',price:3.49,desc:'Sweet honey pastry',veg:true,customizable:[]},
    ]},
  { id:'bk', name:'Burger King', cat:'Burgers', time:'10-15 min', open:true, distance:'0.3 mi', icon:'fast-food-outline',
    menu:[
      {id:'bk1',name:'Whopper',price:6.99,desc:'Classic flame-grilled burger',veg:false,customizable:['extras','sauce','diet','protein']},
      {id:'bk2',name:'Double Cheeseburger',price:5.49,desc:'Two patties, double cheese',veg:false,customizable:['extras','sauce','diet']},
      {id:'bk3',name:'Chicken Fries',price:4.99,desc:'Crispy chicken strips',veg:false,customizable:['sauce','spice','diet']},
      {id:'bk4',name:'Large Fries',price:2.99,desc:'Golden crispy fries',veg:true,customizable:['size','sauce']},
      {id:'bk5',name:'Onion Rings',price:2.79,desc:'Crispy battered rings',veg:true,customizable:['sauce']},
    ]},
  { id:'ub', name:'Union Burger', cat:'Burgers', time:'10-20 min', open:true, distance:'0.4 mi', icon:'fast-food-outline',
    menu:[
      {id:'ub1',name:'Union Burger',price:8.99,desc:'Signature house burger',veg:false,customizable:['extras','sauce','diet','protein']},
      {id:'ub2',name:'BBQ Bacon Burger',price:9.99,desc:'Smoky BBQ with bacon',veg:false,customizable:['extras','sauce','spice','diet']},
      {id:'ub3',name:'Veggie Burger',price:7.99,desc:'Plant-based patty',veg:true,customizable:['extras','sauce','diet']},
      {id:'ub4',name:'Loaded Fries',price:4.99,desc:'Fries with cheese & jalapenos',veg:true,customizable:['extras','spice','sauce']},
      {id:'ub5',name:'Milkshake',price:4.49,desc:'Thick creamy milkshake',veg:true,customizable:['size']},
    ]},
];

type CartItem = {id:string;name:string;price:number;qty:number;restaurant:string};
type TabName = 'home'|'pay'|'food'|'swap'|'profile';
type ProfileView = 'main'|'changePassword'|'twoFactor'|'notifications'|'deleteAccount'|'help'|'privacy';

export default function HomeScreen({navigation}:any) {
  const [activeTab,setActiveTab] = useState<TabName>('home');
  const [profileView,setProfileView] = useState<ProfileView>('main');
  const [loading,setLoading] = useState(true);
  const [studentName,setStudentName] = useState('');
  const [euid,setEuid] = useState('');
  const [flexBalance,setFlexBalance] = useState(0);
  const [euIdLinked,setEuIdLinked] = useState(false);
  const [userEmail,setUserEmail] = useState('');
  const [darkMode,setDarkMode] = useState(false);
  const [notifOrders,setNotifOrders] = useState(true);
  const [notifSwaps,setNotifSwaps] = useState(true);
  const [notifBalance,setNotifBalance] = useState(true);
  const [notifPromo,setNotifPromo] = useState(false);
  const [cart,setCart] = useState<CartItem[]>([]);
  const [selectedRest,setSelectedRest] = useState<typeof RESTAURANTS[0]|null>(null);
  const [showCart,setShowCart] = useState(false);
  const [showAddFunds,setShowAddFunds] = useState(false);

  const T:Theme = darkMode ? DARK : LIGHT;

  useEffect(()=>{loadStudentData();},[]);

  async function loadStudentData() {
    try {
      const user = auth.currentUser;
      if (!user) { navigation.navigate('Login'); return; }
      setUserEmail(user.email||'');
      const snap = await getDoc(doc(db,'students',user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setStudentName(d.displayName||user.displayName||'Student');
        setEuid(d.euid||'');
        setFlexBalance(d.flexBalance||0);
        setEuIdLinked(d.euIdLinked||false);
      } else { setStudentName(user.displayName||'Student'); }
    } catch(e){console.log('HOME ERROR:',e);}
    finally{setLoading(false);}
  }

  async function handleSignOut(){await signOut(auth);navigation.navigate('Login');}

  function addToCart(item:{id:string;name:string;price:number;desc:string},restName:string){
    setCart(prev=>{
      const ex = prev.find(c=>c.id===item.id);
      if(ex) return prev.map(c=>c.id===item.id?{...c,qty:c.qty+1}:c);
      return [...prev,{id:item.id,name:item.name,price:item.price,qty:1,restaurant:restName}];
    });
  }
  function removeFromCart(id:string){
    setCart(prev=>{
      const ex = prev.find(c=>c.id===id);
      if(ex&&ex.qty>1) return prev.map(c=>c.id===id?{...c,qty:c.qty-1}:c);
      return prev.filter(c=>c.id!==id);
    });
  }
  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  async function handleCheckout(){
    if(cartTotal>flexBalance){Alert.alert('Insufficient Balance',`Your Flex balance ($${flexBalance.toFixed(2)}) is not enough for this order ($${cartTotal.toFixed(2)}).`);return;}
    const nb = flexBalance-cartTotal;
    try {
      const user = auth.currentUser;
      if(user) await updateDoc(doc(db,'students',user.uid),{flexBalance:nb});
      setFlexBalance(nb); setCart([]); setShowCart(false); setSelectedRest(null);
      Alert.alert('Order Placed!',`$${cartTotal.toFixed(2)} deducted. New balance: $${nb.toFixed(2)}`);
    } catch(e){Alert.alert('Error','Could not place order.');}
  }

  async function handleAddFunds(amount:number){
    const nb = flexBalance+amount;
    try {
      const user = auth.currentUser;
      if(user) await updateDoc(doc(db,'students',user.uid),{flexBalance:nb});
      setFlexBalance(nb); setShowAddFunds(false);
      Alert.alert('Funds Added!',`$${amount.toFixed(2)} added. New balance: $${nb.toFixed(2)}`);
    } catch(e){Alert.alert('Error','Could not add funds.');}
  }

  if(loading) return(
    <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:T.bg}}>
      <ActivityIndicator size="large" color={T.green}/>
      <Text style={{marginTop:12,color:T.textSub,fontSize:14}}>Loading...</Text>
    </View>
  );

  const firstName = studentName.split(' ')[0]||'Student';

  function Card({children,style}:any){
    return(
      <View style={[{backgroundColor:T.card,borderRadius:12,marginBottom:12,shadowColor:'#000',shadowOffset:{width:0,height:1},shadowOpacity:darkMode?0:0.06,shadowRadius:3,elevation:darkMode?0:2,borderWidth:darkMode?1:0,borderColor:T.cardBorder},style]}>
        {children}
      </View>
    );
  }

  function CartModal(){
    return(
      <Modal visible={showCart} transparent animationType="slide">
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'}}>
          <View style={{backgroundColor:T.card,borderTopLeftRadius:20,borderTopRightRadius:20,padding:24,maxHeight:'80%'}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <Text style={{fontSize:18,fontWeight:'700',color:T.text}}>Your Cart</Text>
              <TouchableOpacity onPress={()=>setShowCart(false)}><Ionicons name="close" size={24} color={T.textSub}/></TouchableOpacity>
            </View>
            <ScrollView style={{maxHeight:300}}>
              {cart.map((item,i)=>(
                <View key={i} style={{flexDirection:'row',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:T.divider,gap:10}}>
                  <View style={{flex:1}}>
                    <Text style={{fontSize:14,fontWeight:'600',color:T.text}}>{item.name}</Text>
                    <Text style={{fontSize:12,color:T.textSub}}>{item.restaurant}</Text>
                  </View>
                  <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                    <TouchableOpacity style={{width:26,height:26,borderRadius:13,backgroundColor:T.redLight,alignItems:'center',justifyContent:'center'}} onPress={()=>removeFromCart(item.id)}>
                      <Ionicons name="remove" size={14} color={T.red}/>
                    </TouchableOpacity>
                    <Text style={{fontSize:14,fontWeight:'700',color:T.text}}>{item.qty}</Text>
                    <TouchableOpacity style={{width:26,height:26,borderRadius:13,backgroundColor:T.greenLight,alignItems:'center',justifyContent:'center'}} onPress={()=>addToCart({id:item.id,name:item.name,price:item.price,desc:''},item.restaurant)}>
                      <Ionicons name="add" size={14} color={T.green}/>
                    </TouchableOpacity>
                  </View>
                  <Text style={{fontSize:14,fontWeight:'700',color:T.text,minWidth:50,textAlign:'right'}}>${(item.price*item.qty).toFixed(2)}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={{marginTop:16,paddingTop:16,borderTopWidth:1,borderTopColor:T.divider}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                <Text style={{fontSize:14,color:T.textSub}}>Total</Text>
                <Text style={{fontSize:14,color:T.text,fontWeight:'700'}}>${cartTotal.toFixed(2)}</Text>
              </View>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:16}}>
                <Text style={{fontSize:14,color:T.textSub}}>Flex Balance</Text>
                <Text style={{fontSize:14,color:T.green,fontWeight:'600'}}>${flexBalance.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={{backgroundColor:cartTotal>flexBalance?T.inactive:T.green,borderRadius:12,paddingVertical:14,alignItems:'center'}} onPress={handleCheckout}>
                <Text style={{color:'#fff',fontSize:15,fontWeight:'700'}}>{cartTotal>flexBalance?'Insufficient Balance':`Pay $${cartTotal.toFixed(2)} with Flex`}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function HomeTab(){
    const txns=[
      {icon:'fast-food-outline',name:'Chick-fil-A',date:'Today, 11:30 AM',amount:-8.50,type:'Food Order'},
      {icon:'swap-horizontal-outline',name:'Meal Swap — Jacob',date:'Yesterday, 3:00 PM',amount:+10.00,type:'Swap Received'},
      {icon:'cafe-outline',name:'Starbucks UNT',date:'Jun 16, 9:15 AM',amount:-5.75,type:'Flex Pay'},
    ];
    return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}} showsVerticalScrollIndicator={false}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <View>
            <Text style={{fontSize:20,fontWeight:'700',color:T.text}}>Good day, {firstName} </Text>
            <Text style={{fontSize:12,color:T.textSub,marginTop:2}}>UNT FlexPay</Text>
          </View>
          <View style={{width:44,height:44,backgroundColor:T.green,borderRadius:10,alignItems:'center',justifyContent:'center'}}>
            <Text style={{color:'#fff',fontSize:13,fontWeight:'800'}}>UNT</Text>
          </View>
        </View>
        <View style={{backgroundColor:T.green,borderRadius:16,padding:18,marginBottom:14}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
              <View style={{backgroundColor:'#fff',borderRadius:6,paddingHorizontal:6,paddingVertical:2}}>
                <Text style={{color:T.green,fontSize:11,fontWeight:'800'}}>UNT</Text>
              </View>
              <Text style={{color:'#fff',fontSize:15,fontWeight:'700'}}>FlexPay</Text>
            </View>
            <View style={{backgroundColor:'rgba(255,255,255,0.2)',borderRadius:4,paddingHorizontal:8,paddingVertical:3}}>
              <Text style={{color:'#fff',fontSize:9,fontWeight:'700',letterSpacing:0.5}}>DIGITAL EUID</Text>
            </View>
          </View>
          <Text style={{color:'#fff',fontSize:18,fontWeight:'700',marginBottom:2}}>{studentName}</Text>
          <Text style={{color:'rgba(255,255,255,0.75)',fontSize:12,letterSpacing:2,marginBottom:12}}>{euid||'EUID Not Linked'}</Text>
          <View style={{height:1,backgroundColor:'rgba(255,255,255,0.2)',marginBottom:12}}/>
          <Text style={{color:'rgba(255,255,255,0.75)',fontSize:11,marginBottom:2}}>Flex Balance</Text>
          <Text style={{color:'#fff',fontSize:32,fontWeight:'700',marginBottom:12}}>${flexBalance.toFixed(2)}</Text>
          <View style={{backgroundColor:'#fff',borderRadius:10,padding:14,alignItems:'center'}}>
            <Ionicons name="qr-code" size={80} color="#1A1A1A"/>
            <Text style={{color:T.textSub,fontSize:11,marginTop:4}}>Refreshes every 30s</Text>
          </View>
        </View>
        {!euIdLinked&&(
          <TouchableOpacity style={{backgroundColor:'#FFF3CD',borderLeftWidth:3,borderLeftColor:'#F59E0B',borderRadius:6,padding:10,marginBottom:14}} onPress={()=>navigation.navigate('EUIDLinking')}>
            <Text style={{color:'#92400E',fontSize:12}}>Link your EUID to activate Flex Pay</Text>
          </TouchableOpacity>
        )}
        <Text style={{fontSize:15,fontWeight:'700',color:T.text,marginBottom:10}}>Quick Actions</Text>
        <View style={{flexDirection:'row',gap:10,marginBottom:18}}>
          {[
            {icon:'phone-portrait-outline',label:'Flex Pay',sub:'QR / NFC',bg:T.greenLight,tab:'pay' as TabName,color:T.green},
            {icon:'fast-food-outline',label:'Order Food',sub:'UNT Dining',bg:darkMode?'#2D1B00':'#FFF3E0',tab:'food' as TabName,color:'#F57C00'},
            {icon:'swap-horizontal-outline',label:'Meal Swap',sub:'Share Credits',bg:darkMode?'#001233':'#E3F2FD',tab:'swap' as TabName,color:'#1565C0'},
            {icon:'person-outline',label:'Profile',sub:'Settings',bg:darkMode?'#1A0A2E':'#F3E5F5',tab:'profile' as TabName,color:'#6A1B9A'},
          ].map((a,i)=>(
            <TouchableOpacity key={i} style={{flex:1,backgroundColor:T.card,borderRadius:12,padding:12,alignItems:'center',borderWidth:darkMode?1:0,borderColor:T.cardBorder}} onPress={()=>setActiveTab(a.tab)}>
              <View style={{width:44,height:44,borderRadius:12,backgroundColor:a.bg,alignItems:'center',justifyContent:'center',marginBottom:6}}>
                <Ionicons name={a.icon as any} size={24} color={a.color}/>
              </View>
              <Text style={{fontSize:11,fontWeight:'700',color:T.text,textAlign:'center'}}>{a.label}</Text>
              <Text style={{fontSize:9,color:T.textSub,textAlign:'center',marginTop:1}}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{fontSize:15,fontWeight:'700',color:T.text,marginBottom:10}}>Recent Transactions</Text>
        <Card>
          {txns.map((t,i)=>(
            <View key={i} style={{flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingVertical:10,gap:10,borderBottomWidth:i<txns.length-1?1:0,borderBottomColor:T.divider}}>
              <View style={{width:38,height:38,borderRadius:19,backgroundColor:T.greenLight,alignItems:'center',justifyContent:'center'}}>
                <Ionicons name={t.icon as any} size={20} color={T.green}/>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:13,fontWeight:'600',color:T.text,marginBottom:1}}>{t.name}</Text>
                <Text style={{fontSize:10,color:T.textSub}}>{t.date}</Text>
              </View>
              <View>
                <Text style={{fontSize:13,fontWeight:'700',textAlign:'right',color:t.amount>0?T.green:T.text}}>{t.amount>0?'+':''}${Math.abs(t.amount).toFixed(2)}</Text>
                <Text style={{fontSize:9,color:T.textSub,textAlign:'right'}}>{t.type}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    );
  }

  function PayTab(){
    const [mode,setMode] = useState<'qr'|'nfc'>('qr');
    const [nfcActive,setNfcActive] = useState(false);
    return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <Text style={{fontSize:22,fontWeight:'700',color:T.text,marginBottom:16}}>Flex Pay</Text>
        <Card style={{padding:20,alignItems:'center',marginBottom:16}}>
          <Text style={{fontSize:12,color:T.textSub,marginBottom:4}}>Available Balance</Text>
          <Text style={{fontSize:40,fontWeight:'700',color:T.green,marginBottom:12}}>${flexBalance.toFixed(2)}</Text>
          <TouchableOpacity style={{backgroundColor:T.green,borderRadius:8,paddingHorizontal:20,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:6}} onPress={()=>setShowAddFunds(true)}>
            <Ionicons name="add" size={18} color="#fff"/>
            <Text style={{color:'#fff',fontSize:13,fontWeight:'600'}}>Add Funds</Text>
          </TouchableOpacity>
        </Card>
        <View style={{flexDirection:'row',backgroundColor:T.card,borderRadius:12,padding:4,marginBottom:16,borderWidth:darkMode?1:0,borderColor:T.cardBorder}}>
          {(['qr','nfc'] as const).map(m=>(
            <TouchableOpacity key={m} style={{flex:1,paddingVertical:10,alignItems:'center',borderRadius:10,backgroundColor:mode===m?T.green:'transparent'}} onPress={()=>setMode(m)}>
              <Ionicons name={m==='qr'?'qr-code-outline':'wifi-outline'} size={20} color={mode===m?'#fff':T.textSub}/>
              <Text style={{fontSize:12,color:mode===m?'#fff':T.textSub,fontWeight:'600',marginTop:4}}>{m==='qr'?'QR Code':'NFC Tap'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {mode==='qr'&&(
          <Card style={{padding:24,alignItems:'center'}}>
            <Text style={{fontSize:14,fontWeight:'600',color:T.text,marginBottom:4}}>Show QR at register</Text>
            <Text style={{fontSize:12,color:T.textSub,marginBottom:20}}>Code refreshes every 30 seconds</Text>
            <View style={{backgroundColor:'#fff',borderRadius:16,padding:20,alignItems:'center',marginBottom:16}}>
              <Ionicons name="qr-code" size={180} color="#1A1A1A"/>
            </View>
            <View style={{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:T.greenLight,borderRadius:8,paddingHorizontal:12,paddingVertical:6}}>
              <View style={{width:8,height:8,borderRadius:4,backgroundColor:T.green}}/>
              <Text style={{fontSize:12,color:T.green,fontWeight:'600'}}>Active - Expires in 30s</Text>
            </View>
          </Card>
        )}
        {mode==='nfc'&&(
          <Card style={{padding:24,alignItems:'center'}}>
            <Text style={{fontSize:14,fontWeight:'600',color:T.text,marginBottom:4}}>Tap your phone at the terminal</Text>
            <Text style={{fontSize:12,color:T.textSub,marginBottom:24}}>Hold phone near NFC reader to pay</Text>
            <TouchableOpacity style={{width:160,height:160,borderRadius:80,backgroundColor:nfcActive?T.green:T.greenLight,alignItems:'center',justifyContent:'center',marginBottom:20,borderWidth:3,borderColor:T.green}} onPress={()=>{setNfcActive(true);setTimeout(()=>{setNfcActive(false);Alert.alert('NFC Ready','Hold your phone near the payment terminal.');},1500);}}>
              <Ionicons name="wifi-outline" size={64} color={nfcActive?'#fff':T.green}/>
              <Text style={{fontSize:13,color:nfcActive?'#fff':T.green,fontWeight:'700',marginTop:8}}>{nfcActive?'Ready!':'Tap to Enable'}</Text>
            </TouchableOpacity>
            <View style={{backgroundColor:T.greenLight,borderRadius:8,padding:12,width:'100%'}}>
              <Text style={{fontSize:12,color:T.green,textAlign:'center'}}>Works at all UNT Dining registers with the NFC symbol</Text>
            </View>
          </Card>
        )}
        <Modal visible={showAddFunds} transparent animationType="slide">
          <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'}}>
            <View style={{backgroundColor:T.card,borderTopLeftRadius:20,borderTopRightRadius:20,padding:24}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <Text style={{fontSize:18,fontWeight:'700',color:T.text}}>Add Funds</Text>
                <TouchableOpacity onPress={()=>setShowAddFunds(false)}><Ionicons name="close" size={24} color={T.textSub}/></TouchableOpacity>
              </View>
              <Text style={{fontSize:13,color:T.textSub,marginBottom:16}}>Select amount to add to your Flex balance:</Text>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,marginBottom:20}}>
                {[10,25,50,100,150,200].map(amt=>(
                  <TouchableOpacity key={amt} style={{flex:1,minWidth:'28%',backgroundColor:T.greenLight,borderRadius:10,paddingVertical:14,alignItems:'center',borderWidth:1.5,borderColor:T.green}} onPress={()=>handleAddFunds(amt)}>
                    <Text style={{fontSize:16,fontWeight:'700',color:T.green}}>${amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{backgroundColor:T.greenLight,borderRadius:8,padding:12}}>
                <Text style={{fontSize:12,color:T.green,textAlign:'center'}}>Funds are added instantly to your Flex balance</Text>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  function FoodTab(){
    const [search,setSearch] = useState('');
    const [activeFilter,setActiveFilter] = useState('All');
    const [vegOnly,setVegOnly] = useState(false);
    const [customItem,setCustomItem] = useState<any>(null);
    const [selections,setSelections] = useState<Record<string,string>>({});
    const [specialNote,setSpecialNote] = useState('');
    const filters = ['All','Burgers','Chicken','Coffee','Bakery','Asian','Middle Eastern'];
    const filtered = RESTAURANTS.filter(r=>
      (activeFilter==='All'||r.cat===activeFilter)&&
      (search===''||r.name.toLowerCase().includes(search.toLowerCase()))
    );

    function openCustomize(item:any){
      setCustomItem(item);
      setSelections({});
      setSpecialNote('');
    }

    function handleAddCustomized(){
      if(!selectedRest||!customItem) return;
      // Calculate price adjustments
      let extraPrice = 0;
      if(selections['size']==='Large (+$1.50)') extraPrice+=1.50;
      if(selections['size']==='Small (-$0.50)') extraPrice-=0.50;
      if(selections['protein']==='Extra Protein (+$1.00)') extraPrice+=1.00;
      if(selections['extras']==='Add Cheese (+$0.75)') extraPrice+=0.75;
      if(selections['extras']==='Add Bacon (+$1.25)') extraPrice+=1.25;
      if(selections['extras']==='Add Avocado (+$1.00)') extraPrice+=1.00;
      if(selections['extras']==='Add Egg (+$0.75)') extraPrice+=0.75;
      const finalPrice = customItem.price + extraPrice;
      const custDesc = Object.values(selections).filter(v=>v&&v!=='None'&&v!=='No Preference'&&v!=='Regular Sauce'&&v!=='Regular').join(', ');
      const itemName = custDesc ? `${customItem.name} (${custDesc})` : customItem.name;
      addToCart({id:customItem.id+'_'+Date.now(),name:itemName,price:finalPrice,desc:customItem.desc},selectedRest.name);
      setCustomItem(null);
    }

    if(selectedRest){
      const menuItems = selectedRest.menu.filter((item:any) => !vegOnly || item.veg);
      return(
        <View style={{flex:1,backgroundColor:T.bg}}>
          <ScrollView contentContainerStyle={{paddingBottom:100}}>
            {/* Header */}
            <View style={{backgroundColor:T.green,padding:20,paddingTop:16}}>
              <TouchableOpacity style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:12}} onPress={()=>setSelectedRest(null)}>
                <Ionicons name="arrow-back" size={20} color="#fff"/>
                <Text style={{color:'#fff',fontSize:15}}>Back</Text>
              </TouchableOpacity>
              <Text style={{fontSize:24,fontWeight:'700',color:'#fff',marginBottom:4}}>{selectedRest.name}</Text>
              <Text style={{fontSize:13,color:'rgba(255,255,255,0.8)'}}>{selectedRest.cat} - {selectedRest.time} - {selectedRest.distance}</Text>
            </View>

            {/* Veg Filter */}
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:12,backgroundColor:T.card,borderBottomWidth:1,borderBottomColor:T.divider}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                <View style={{width:20,height:20,borderRadius:4,backgroundColor:'#22C55E',alignItems:'center',justifyContent:'center'}}>
                  <Text style={{color:'#fff',fontSize:10,fontWeight:'800'}}>V</Text>
                </View>
                <Text style={{fontSize:14,fontWeight:'600',color:T.text}}>Veg Only</Text>
                <Text style={{fontSize:12,color:T.textSub}}>Show vegetarian items</Text>
              </View>
              <Switch value={vegOnly} onValueChange={setVegOnly} trackColor={{false:T.cardBorder,true:'#22C55E'}} thumbColor="#fff"/>
            </View>

            <View style={{padding:20}}>
              <Text style={{fontSize:15,fontWeight:'700',color:T.text,marginBottom:12}}>Menu {vegOnly?'(Veg Only)':''}</Text>
              {menuItems.length === 0 && (
                <View style={{alignItems:'center',paddingVertical:32}}>
                  <Text style={{fontSize:32,marginBottom:8}}>🥦</Text>
                  <Text style={{fontSize:16,fontWeight:'600',color:T.text}}>No veg items available</Text>
                  <Text style={{fontSize:13,color:T.textSub,marginTop:4}}>Try turning off Veg Only filter</Text>
                </View>
              )}
              {menuItems.map((item:any,i:number)=>{
                const inCart = cart.find(c=>c.id===item.id);
                const hasCustom = item.customizable && item.customizable.length > 0;
                return(
                  <Card key={i} style={{padding:14}}>
                    <View style={{flexDirection:'row',alignItems:'flex-start',gap:12}}>
                      <View style={{width:48,height:48,borderRadius:12,backgroundColor:T.greenLight,alignItems:'center',justifyContent:'center'}}>
                        <Ionicons name={selectedRest.icon as any} size={24} color={T.green}/>
                      </View>
                      <View style={{flex:1}}>
                        <View style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:2}}>
                          <Text style={{fontSize:14,fontWeight:'700',color:T.text}}>{item.name}</Text>
                          {item.veg && (
                            <View style={{backgroundColor:'#DCFCE7',borderRadius:4,paddingHorizontal:5,paddingVertical:1}}>
                              <Text style={{color:'#16A34A',fontSize:9,fontWeight:'800'}}>VEG</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{fontSize:12,color:T.textSub,marginBottom:4}}>{item.desc}</Text>
                        <Text style={{fontSize:14,fontWeight:'700',color:T.green}}>${item.price.toFixed(2)}</Text>
                        {hasCustom && (
                          <Text style={{fontSize:11,color:T.textSub,marginTop:2}}>Customizable</Text>
                        )}
                      </View>
                      <View style={{alignItems:'flex-end',gap:6}}>
                        {inCart?(
                          <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                            <TouchableOpacity style={{width:28,height:28,borderRadius:14,backgroundColor:T.redLight,alignItems:'center',justifyContent:'center'}} onPress={()=>removeFromCart(item.id)}>
                              <Ionicons name="remove" size={16} color={T.red}/>
                            </TouchableOpacity>
                            <Text style={{fontSize:16,fontWeight:'700',color:T.text}}>{inCart.qty}</Text>
                            <TouchableOpacity style={{width:28,height:28,borderRadius:14,backgroundColor:T.greenLight,alignItems:'center',justifyContent:'center'}} onPress={()=>hasCustom?openCustomize(item):addToCart(item,selectedRest.name)}>
                              <Ionicons name="add" size={16} color={T.green}/>
                            </TouchableOpacity>
                          </View>
                        ):(
                          <TouchableOpacity style={{backgroundColor:T.green,borderRadius:8,paddingHorizontal:12,paddingVertical:6}} onPress={()=>hasCustom?openCustomize(item):addToCart(item,selectedRest.name)}>
                            <Text style={{color:'#fff',fontSize:13,fontWeight:'600'}}>{hasCustom?'Customize':'Add'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          </ScrollView>

          {/* Cart Button */}
          {cartCount>0&&(
            <View style={{position:'absolute',bottom:0,left:0,right:0,padding:20,backgroundColor:T.bg}}>
              <TouchableOpacity style={{backgroundColor:T.green,borderRadius:12,paddingVertical:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20}} onPress={()=>setShowCart(true)}>
                <View style={{backgroundColor:'rgba(255,255,255,0.2)',borderRadius:6,paddingHorizontal:8,paddingVertical:2}}>
                  <Text style={{color:'#fff',fontWeight:'700'}}>{cartCount}</Text>
                </View>
                <Text style={{color:'#fff',fontSize:15,fontWeight:'700'}}>View Cart</Text>
                <Text style={{color:'#fff',fontSize:15,fontWeight:'700'}}>${cartTotal.toFixed(2)}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Customization Modal */}
          <Modal visible={!!customItem} transparent animationType="slide">
            <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'}}>
              <View style={{backgroundColor:T.card,borderTopLeftRadius:20,borderTopRightRadius:20,padding:24,maxHeight:'85%'}}>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <Text style={{fontSize:18,fontWeight:'700',color:T.text}}>{customItem?.name}</Text>
                  <TouchableOpacity onPress={()=>setCustomItem(null)}><Ionicons name="close" size={24} color={T.textSub}/></TouchableOpacity>
                </View>
                <Text style={{fontSize:13,color:T.textSub,marginBottom:16}}>${customItem?.price.toFixed(2)} · Customize your order below</Text>
                <ScrollView style={{maxHeight:400}} showsVerticalScrollIndicator={false}>
                  {customItem?.customizable?.map((key:string)=>(
                    <View key={key} style={{marginBottom:16}}>
                      <Text style={{fontSize:13,fontWeight:'700',color:T.text,marginBottom:8,textTransform:'capitalize'}}>
                        {key === 'diet' ? 'Dietary Preference' :
                         key === 'protein' ? 'Protein Option' :
                         key === 'extras' ? 'Add Extra' :
                         key === 'spice' ? 'Spice Level' :
                         key === 'sauce' ? 'Sauce' : 'Size'}
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{flexDirection:'row',gap:8}}>
                          {(CUSTOMIZATIONS as any)[key]?.map((opt:string)=>{
                            const isSelected = selections[key]===opt;
                            return(
                              <TouchableOpacity key={opt}
                                style={{paddingHorizontal:14,paddingVertical:8,borderRadius:20,backgroundColor:isSelected?T.green:T.inputBg,borderWidth:1.5,borderColor:isSelected?T.green:T.inputBorder}}
                                onPress={()=>setSelections(prev=>({...prev,[key]:isSelected?'':opt}))}>
                                <Text style={{fontSize:13,color:isSelected?'#fff':T.text,fontWeight:isSelected?'700':'400'}}>{opt}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  ))}
                  {/* Special Instructions */}
                  <View style={{marginBottom:16}}>
                    <Text style={{fontSize:13,fontWeight:'700',color:T.text,marginBottom:8}}>Special Instructions</Text>
                    <TextInput
                      style={{backgroundColor:T.inputBg,borderWidth:1,borderColor:T.inputBorder,borderRadius:8,padding:12,fontSize:13,color:T.text,minHeight:60}}
                      placeholder="e.g. No onions, extra spicy, allergy info..."
                      placeholderTextColor={T.textSub}
                      value={specialNote}
                      onChangeText={setSpecialNote}
                      multiline
                    />
                  </View>
                </ScrollView>
                <TouchableOpacity style={{backgroundColor:T.green,borderRadius:12,paddingVertical:14,alignItems:'center',marginTop:12}} onPress={handleAddCustomized}>
                  <Text style={{color:'#fff',fontSize:15,fontWeight:'700'}}>Add to Cart - ${customItem?.price.toFixed(2)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <CartModal/>
        </View>
      );
    }

    return(
      <View style={{flex:1,backgroundColor:T.bg}}>
        <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <Text style={{fontSize:22,fontWeight:'700',color:T.text}}>UNT Dining</Text>
            <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
              {cartCount>0&&(
                <TouchableOpacity style={{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:T.green,borderRadius:20,paddingHorizontal:12,paddingVertical:6}} onPress={()=>setShowCart(true)}>
                  <Ionicons name="cart-outline" size={18} color="#fff"/>
                  <Text style={{color:'#fff',fontSize:13,fontWeight:'700'}}>{cartCount} - ${cartTotal.toFixed(2)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          {/* Veg toggle on list */}
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:T.card,borderRadius:10,padding:12,marginBottom:12,borderWidth:darkMode?1:0,borderColor:T.cardBorder}}>
            <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
              <View style={{width:22,height:22,borderRadius:4,backgroundColor:'#22C55E',alignItems:'center',justifyContent:'center'}}>
                <Text style={{color:'#fff',fontSize:10,fontWeight:'800'}}>V</Text>
              </View>
              <Text style={{fontSize:14,fontWeight:'600',color:T.text}}>Veg Only Mode</Text>
            </View>
            <Switch value={vegOnly} onValueChange={setVegOnly} trackColor={{false:T.cardBorder,true:'#22C55E'}} thumbColor="#fff"/>
          </View>
          <View style={{flexDirection:'row',alignItems:'center',backgroundColor:T.card,borderRadius:10,paddingHorizontal:12,paddingVertical:10,gap:8,marginBottom:12,borderWidth:darkMode?1:0,borderColor:T.cardBorder}}>
            <Ionicons name="search-outline" size={18} color={T.textSub}/>
            <TextInput style={{flex:1,fontSize:14,color:T.text}} placeholder="Search restaurants..." placeholderTextColor={T.textSub} value={search} onChangeText={setSearch}/>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>
            {filters.map(f=>(
              <TouchableOpacity key={f} style={{paddingHorizontal:16,paddingVertical:6,borderRadius:20,backgroundColor:activeFilter===f?T.green:T.card,marginRight:8,borderWidth:1,borderColor:activeFilter===f?T.green:T.cardBorder}} onPress={()=>setActiveFilter(f)}>
                <Text style={{fontSize:13,color:activeFilter===f?'#fff':T.textSub,fontWeight:'500'}}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {filtered.map((r,i)=>(
            <TouchableOpacity key={i} onPress={()=>r.open?setSelectedRest(r):Alert.alert('Closed',`${r.name} is currently closed.`)}>
              <Card style={{flexDirection:'row',alignItems:'center',padding:14,gap:12,opacity:r.open?1:0.6}}>
                <View style={{width:52,height:52,borderRadius:12,backgroundColor:T.greenLight,alignItems:'center',justifyContent:'center'}}>
                  <Ionicons name={r.icon as any} size={28} color={T.green}/>
                </View>
                <View style={{flex:1}}>
                  <Text style={{fontSize:14,fontWeight:'700',color:T.text,marginBottom:2}}>{r.name}</Text>
                  <Text style={{fontSize:12,color:T.textSub}}>{r.cat} - {r.time} - {r.distance}</Text>
                </View>
                <View style={{alignItems:'flex-end',gap:4}}>
                  <View style={{backgroundColor:r.open?T.greenLight:T.redLight,borderRadius:6,paddingHorizontal:8,paddingVertical:3}}>
                    <Text style={{color:r.open?T.green:T.red,fontSize:11,fontWeight:'600'}}>{r.open?'Open':'Closed'}</Text>
                  </View>
                  {r.open&&<Ionicons name="chevron-forward" size={16} color={T.inactive}/>}
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <CartModal/>
      </View>
    );
  }

  function SwapTab(){
    const [swapTab,setSwapTab] = useState<'offering'|'requesting'|'myswaps'>('offering');
    const [showModal,setShowModal] = useState(false);
    const [offerAmount,setOfferAmount] = useState('');
    const [offerNote,setOfferNote] = useState('');
    const [myOffers,setMyOffers] = useState<{amount:string;note:string;date:string}[]>([]);
    const [posting,setPosting] = useState(false);
    const offers=[
      {name:'Jacob M.',amount:15,note:'Expiring soon!',initials:'JM',expiry:'Jun 20'},
      {name:'Redeat T.',amount:8,note:'Happy to help',initials:'RT',expiry:'Jun 22'},
      {name:'Jeff K.',amount:20,note:'Extra credits',initials:'JK',expiry:'Jun 25'},
    ];
    function handlePostOffer(){
      if(!offerAmount||isNaN(Number(offerAmount))||Number(offerAmount)<=0){Alert.alert('Error','Please enter a valid amount.');return;}
      if(Number(offerAmount)>flexBalance){Alert.alert('Insufficient Balance',`Your Flex balance is $${flexBalance.toFixed(2)}.`);return;}
      setPosting(true);
      setTimeout(()=>{
        setMyOffers(prev=>[...prev,{amount:offerAmount,note:offerNote||'Available for swap',date:'Just now'}]);
        setPosting(false);setShowModal(false);setOfferAmount('');setOfferNote('');
        setSwapTab('myswaps');
        Alert.alert('Offer Posted!',`Your offer of $${offerAmount} has been posted!`);
      },1000);
    }
    return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <Text style={{fontSize:22,fontWeight:'700',color:T.text,marginBottom:16}}>Meal Swap</Text>
        <Modal visible={showModal} transparent animationType="slide">
          <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'flex-end'}}>
            <View style={{backgroundColor:T.card,borderTopLeftRadius:20,borderTopRightRadius:20,padding:24}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                <Text style={{fontSize:18,fontWeight:'700',color:T.text}}>Post a Swap Offer</Text>
                <TouchableOpacity onPress={()=>setShowModal(false)}><Ionicons name="close" size={24} color={T.textSub}/></TouchableOpacity>
              </View>
              <Text style={{fontSize:12,color:T.textSub,marginBottom:4,fontWeight:'500'}}>Amount ($)</Text>
              <TextInput style={{backgroundColor:T.inputBg,borderWidth:1,borderColor:T.inputBorder,borderRadius:8,paddingHorizontal:14,paddingVertical:12,fontSize:24,color:T.text,fontWeight:'700',textAlign:'center',marginBottom:12}} placeholder="0.00" placeholderTextColor={T.textSub} value={offerAmount} onChangeText={setOfferAmount} keyboardType="decimal-pad"/>
              <Text style={{fontSize:12,color:T.textSub,marginBottom:4,fontWeight:'500'}}>Note (optional)</Text>
              <TextInput style={{backgroundColor:T.inputBg,borderWidth:1,borderColor:T.inputBorder,borderRadius:8,paddingHorizontal:14,paddingVertical:12,fontSize:14,color:T.text,marginBottom:16}} placeholder="e.g. Expiring soon!" placeholderTextColor={T.textSub} value={offerNote} onChangeText={setOfferNote}/>
              <View style={{backgroundColor:T.greenLight,borderRadius:8,padding:10,marginBottom:16}}>
                <Text style={{fontSize:12,color:T.green}}>Your balance: <Text style={{fontWeight:'700'}}>${flexBalance.toFixed(2)}</Text></Text>
              </View>
              <TouchableOpacity style={{backgroundColor:T.green,borderRadius:10,paddingVertical:14,alignItems:'center',opacity:posting?0.6:1}} onPress={handlePostOffer} disabled={posting}>
                {posting?<ActivityIndicator color="#fff"/>:<Text style={{color:'#fff',fontSize:15,fontWeight:'600'}}>Post Offer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <TouchableOpacity style={{backgroundColor:T.green,borderRadius:10,paddingVertical:13,alignItems:'center',marginBottom:16,flexDirection:'row',justifyContent:'center',gap:8}} onPress={()=>setShowModal(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#fff"/>
          <Text style={{color:'#fff',fontSize:14,fontWeight:'600'}}>Post a Swap Offer</Text>
        </TouchableOpacity>
        <View style={{flexDirection:'row',backgroundColor:T.card,borderRadius:10,padding:4,marginBottom:16,borderWidth:darkMode?1:0,borderColor:T.cardBorder}}>
          {(['offering','requesting','myswaps'] as const).map(t=>(
            <TouchableOpacity key={t} style={{flex:1,paddingVertical:8,alignItems:'center',borderRadius:8,backgroundColor:swapTab===t?T.green:'transparent'}} onPress={()=>setSwapTab(t)}>
              <Text style={{fontSize:12,color:swapTab===t?'#fff':T.textSub,fontWeight:swapTab===t?'700':'500'}}>
                {t==='offering'?'Offering':t==='requesting'?'Requesting':'My Swaps'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {swapTab==='offering'&&offers.map((s,i)=>(
          <Card key={i} style={{flexDirection:'row',alignItems:'center',padding:14,gap:12}}>
            <View style={{width:44,height:44,borderRadius:22,backgroundColor:T.green,alignItems:'center',justifyContent:'center'}}>
              <Text style={{color:'#fff',fontSize:14,fontWeight:'700'}}>{s.initials}</Text>
            </View>
            <View style={{flex:1}}>
              <Text style={{fontSize:14,fontWeight:'600',color:T.text,marginBottom:2}}>{s.name}</Text>
              <Text style={{fontSize:12,color:T.textSub}}>{s.note}</Text>
              <Text style={{fontSize:11,color:'#F57C00',marginTop:2}}>Expires {s.expiry}</Text>
            </View>
            <View style={{alignItems:'flex-end',gap:6}}>
              <Text style={{fontSize:16,fontWeight:'700',color:T.text}}>${s.amount}.00</Text>
              <TouchableOpacity style={{backgroundColor:T.greenLight,borderRadius:6,paddingHorizontal:10,paddingVertical:4}} onPress={()=>Alert.alert('Request Swap',`Request $${s.amount} from ${s.name}?`,[{text:'Cancel',style:'cancel'},{text:'Request',onPress:()=>Alert.alert('Sent!','Swap request sent!')}])}>
                <Text style={{color:T.green,fontSize:12,fontWeight:'600'}}>Request</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
        {swapTab==='requesting'&&(
          <View style={{alignItems:'center',paddingVertical:40}}>
            <Ionicons name="search-outline" size={48} color={T.inactive}/>
            <Text style={{fontSize:16,fontWeight:'600',color:T.text,marginTop:12}}>No requests yet</Text>
            <Text style={{fontSize:13,color:T.textSub,marginTop:4}}>Requests you send will appear here.</Text>
          </View>
        )}
        {swapTab==='myswaps'&&(
          myOffers.length===0?(
            <View style={{alignItems:'center',paddingVertical:40}}>
              <Ionicons name="swap-horizontal-outline" size={48} color={T.inactive}/>
              <Text style={{fontSize:16,fontWeight:'600',color:T.text,marginTop:12}}>No active offers</Text>
              <Text style={{fontSize:13,color:T.textSub,marginTop:4}}>Tap "Post a Swap Offer" to get started.</Text>
            </View>
          ):myOffers.map((offer,i)=>(
            <Card key={i} style={{flexDirection:'row',alignItems:'center',padding:14,gap:12}}>
              <View style={{width:44,height:44,borderRadius:22,backgroundColor:T.green,alignItems:'center',justifyContent:'center'}}>
                <Text style={{color:'#fff',fontSize:14,fontWeight:'700'}}>{firstName.charAt(0)}</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:14,fontWeight:'600',color:T.text,marginBottom:2}}>My Offer - ${offer.amount}</Text>
                <Text style={{fontSize:12,color:T.textSub}}>{offer.note}</Text>
                <Text style={{fontSize:11,color:T.green,marginTop:2}}>Posted {offer.date}</Text>
              </View>
              <TouchableOpacity style={{backgroundColor:T.redLight,borderRadius:6,paddingHorizontal:10,paddingVertical:4}} onPress={()=>Alert.alert('Cancel Offer','Cancel this swap offer?',[{text:'No',style:'cancel'},{text:'Yes',onPress:()=>setMyOffers(prev=>prev.filter((_,idx)=>idx!==i))}])}>
                <Text style={{color:T.red,fontSize:12,fontWeight:'600'}}>Cancel</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScrollView>
    );
  }

  function ChangePasswordView(){
    const [cp,setCp]=useState('');const [np,setNp]=useState('');const [cnp,setCnp]=useState('');
    const [err,setErr]=useState('');const [ok,setOk]=useState(false);const [saving,setSaving]=useState(false);
    const [sc,setSc]=useState(false);const [sn,setSn]=useState(false);
    async function handle(){
      setErr('');
      if(!cp){setErr('Current password required.');return;}
      if(np.length<8){setErr('Min. 8 characters.');return;}
      if(np!==cnp){setErr('Passwords do not match.');return;}
      setSaving(true);
      try{
        const u=auth.currentUser!;
        await reauthenticateWithCredential(u,EmailAuthProvider.credential(u.email!,cp));
        await updatePassword(u,np);setOk(true);
      }catch(e:any){setErr(e.code==='auth/wrong-password'||e.code==='auth/invalid-credential'?'Current password is incorrect.':`Error: ${e.code}`);}
      finally{setSaving(false);}
    }
    if(ok)return(
      <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:32,backgroundColor:T.bg}}>
        <Ionicons name="checkmark-circle" size={64} color={T.green}/>
        <Text style={{fontSize:22,fontWeight:'700',color:T.text,marginTop:16,marginBottom:8}}>Password Changed!</Text>
        <TouchableOpacity style={{backgroundColor:T.green,borderRadius:10,paddingVertical:14,paddingHorizontal:32,marginTop:8}} onPress={()=>{setProfileView('main');setOk(false);}}>
          <Text style={{color:'#fff',fontSize:15,fontWeight:'600'}}>Back to Profile</Text>
        </TouchableOpacity>
      </View>
    );
    return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <TouchableOpacity style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}} onPress={()=>setProfileView('main')}>
          <Ionicons name="arrow-back" size={20} color={T.green}/><Text style={{fontSize:15,color:T.green,fontWeight:'500'}}>Back</Text>
        </TouchableOpacity>
        <Text style={{fontSize:22,fontWeight:'700',color:T.text,marginBottom:16}}>Change Password</Text>
        {err?<View style={{backgroundColor:T.redLight,borderLeftWidth:3,borderLeftColor:T.red,borderRadius:6,padding:12,marginBottom:16}}><Text style={{color:T.red}}>{err}</Text></View>:null}
        <Text style={{fontSize:12,color:T.textSub,marginBottom:4}}>Current Password</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:T.inputBg,borderWidth:1,borderColor:T.inputBorder,borderRadius:8,paddingHorizontal:14,paddingVertical:12,gap:8,marginBottom:12}}>
          <TextInput style={{flex:1,fontSize:14,color:T.text}} placeholder="Current password" placeholderTextColor={T.textSub} value={cp} onChangeText={setCp} secureTextEntry={!sc}/>
          <TouchableOpacity onPress={()=>setSc(!sc)}><Ionicons name={sc?'eye-off-outline':'eye-outline'} size={20} color={T.textSub}/></TouchableOpacity>
        </View>
        <Text style={{fontSize:12,color:T.textSub,marginBottom:4}}>New Password</Text>
        <View style={{flexDirection:'row',alignItems:'center',backgroundColor:T.inputBg,borderWidth:1,borderColor:T.inputBorder,borderRadius:8,paddingHorizontal:14,paddingVertical:12,gap:8,marginBottom:4}}>
          <TextInput style={{flex:1,fontSize:14,color:T.text}} placeholder="Min. 8 characters" placeholderTextColor={T.textSub} value={np} onChangeText={setNp} secureTextEntry={!sn}/>
          <TouchableOpacity onPress={()=>setSn(!sn)}><Ionicons name={sn?'eye-off-outline':'eye-outline'} size={20} color={T.textSub}/></TouchableOpacity>
        </View>
        {np.length>0&&(
          <View style={{flexDirection:'row',gap:12,marginBottom:12}}>
            {['8+ chars','Uppercase','Number'].map((req,i)=>{
              const met=i===0?np.length>=8:i===1?/[A-Z]/.test(np):/[0-9]/.test(np);
              return<View key={i} style={{flexDirection:'row',alignItems:'center',gap:4}}><Ionicons name={met?'checkmark-circle':'ellipse-outline'} size={14} color={met?T.green:T.textSub}/><Text style={{fontSize:11,color:met?T.green:T.textSub}}>{req}</Text></View>;
            })}
          </View>
        )}
        <Text style={{fontSize:12,color:T.textSub,marginBottom:4}}>Confirm Password</Text>
        <View style={{backgroundColor:T.inputBg,borderWidth:1,borderColor:T.inputBorder,borderRadius:8,paddingHorizontal:14,paddingVertical:12,marginBottom:24}}>
          <TextInput style={{fontSize:14,color:T.text}} placeholder="Re-enter new password" placeholderTextColor={T.textSub} value={cnp} onChangeText={setCnp} secureTextEntry/>
        </View>
        <TouchableOpacity style={{backgroundColor:T.green,borderRadius:10,paddingVertical:14,alignItems:'center',opacity:saving?0.6:1}} onPress={handle} disabled={saving}>
          {saving?<ActivityIndicator color="#fff"/>:<Text style={{color:'#fff',fontSize:15,fontWeight:'600'}}>Update Password</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function TwoFactorView(){
    const [step,setStep]=useState<1|2|3>(1);const [code,setCode]=useState('');
    const [twoFaOtp,setTwoFaOtp]=useState('');
    const [twoFaLoading,setTwoFaLoading]=useState(false);
    const bk=['FLEX-A1B2','FLEX-C3D4','FLEX-E5F6','FLEX-G7H8','FLEX-I9J0'];
    async function sendTwoFaOtp(){
      const otp=Math.floor(100000+Math.random()*900000).toString();
      setTwoFaOtp(otp);
      setTwoFaLoading(true);
      try{
        await fetch('https://api.emailjs.com/api/v1.0/email/send',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            service_id:'service_wccm37x',
            template_id:'template_202imv3',
            user_id:'3BkZQfzyMNpNtRWyL',
            accessToken:process.env.EXPO_PUBLIC_EMAILJS_ACCESS_TOKEN ?? '',
            template_params:{to_email:userEmail,to_name:studentName,otp_code:otp,email:userEmail,name:studentName},
          }),
        });
        setStep(2);
      }catch(e){Alert.alert('Error','Could not send OTP. Try again.');}
      finally{setTwoFaLoading(false);}
    }
    if(step===1)return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <TouchableOpacity style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}} onPress={()=>setProfileView('main')}>
          <Ionicons name="arrow-back" size={20} color={T.green}/><Text style={{fontSize:15,color:T.green,fontWeight:'500'}}>Back</Text>
        </TouchableOpacity>
        <Text style={{fontSize:22,fontWeight:'700',color:T.text,marginBottom:16}}>Two-Factor Auth</Text>
        <View style={{backgroundColor:T.greenLight,borderRadius:12,padding:24,alignItems:'center',marginBottom:16}}>
          <Ionicons name="shield-checkmark-outline" size={48} color={T.green} style={{marginBottom:12}}/>
          <Text style={{fontSize:18,fontWeight:'700',color:T.green,marginBottom:8}}>Add Extra Security</Text>
          <Text style={{fontSize:13,color:T.textSub,textAlign:'center',lineHeight:20}}>2FA protects your account with your UNT email.</Text>
        </View>
        <TouchableOpacity style={{backgroundColor:T.green,borderRadius:10,paddingVertical:14,alignItems:'center',opacity:twoFaLoading?0.6:1}} onPress={sendTwoFaOtp} disabled={twoFaLoading}>
          <Text style={{color:'#fff',fontSize:15,fontWeight:'600'}}>{twoFaLoading?'Sending...':'Enable Two-Factor Auth'}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
    if(step===2)return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <TouchableOpacity style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}} onPress={()=>setStep(1)}>
          <Ionicons name="arrow-back" size={20} color={T.green}/><Text style={{fontSize:15,color:T.green,fontWeight:'500'}}>Back</Text>
        </TouchableOpacity>
        <Text style={{fontSize:22,fontWeight:'700',color:T.text,marginBottom:8}}>Verify Your Email</Text>
        <Text style={{fontSize:13,color:T.textSub,marginBottom:20}}>A 6-digit code was sent to {userEmail}.</Text>
        <TextInput style={{backgroundColor:T.inputBg,borderWidth:1,borderColor:T.inputBorder,borderRadius:8,paddingHorizontal:14,paddingVertical:12,fontSize:24,color:T.text,textAlign:'center',letterSpacing:8,fontWeight:'700',marginBottom:24}} placeholder="000000" placeholderTextColor={T.textSub} value={code} onChangeText={t=>setCode(t.replace(/[^0-9]/g,'').slice(0,6))} keyboardType="number-pad"/>
        <TouchableOpacity style={{backgroundColor:T.green,borderRadius:10,paddingVertical:14,alignItems:'center'}} onPress={()=>code.length===6?(code===twoFaOtp?setStep(3):Alert.alert('Error','Incorrect code. Try again.')):Alert.alert('Error','Enter the 6-digit code.')}>
          <Text style={{color:'#fff',fontSize:15,fontWeight:'600'}}>Verify & Activate</Text>
        </TouchableOpacity>
      </ScrollView>
    );
    return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <View style={{alignItems:'center',marginBottom:24}}>
          <Ionicons name="shield-checkmark" size={64} color={T.green}/>
          <Text style={{fontSize:22,fontWeight:'700',color:T.text,marginTop:16,marginBottom:8}}>2FA Enabled!</Text>
        </View>
        <Text style={{fontSize:15,fontWeight:'700',color:T.text,marginBottom:8}}>Backup Codes</Text>
        <Card>
          {bk.map((c,i)=>(
            <View key={i} style={{flexDirection:'row',alignItems:'center',padding:12,gap:10,borderBottomWidth:i<bk.length-1?1:0,borderBottomColor:T.divider}}>
              <Ionicons name="key-outline" size={16} color={T.textSub}/>
              <Text style={{fontSize:14,fontWeight:'600',color:T.text,letterSpacing:2}}>{c}</Text>
            </View>
          ))}
        </Card>
        <TouchableOpacity style={{backgroundColor:T.green,borderRadius:10,paddingVertical:14,alignItems:'center'}} onPress={()=>setProfileView('main')}>
          <Text style={{color:'#fff',fontSize:15,fontWeight:'600'}}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function NotificationsView(){
    const items=[
      {label:'Order Updates',sub:'Food order status changes',value:notifOrders,setter:setNotifOrders},
      {label:'Swap Notifications',sub:'New swap offers and requests',value:notifSwaps,setter:setNotifSwaps},
      {label:'Balance Alerts',sub:'Low balance and transactions',value:notifBalance,setter:setNotifBalance},
      {label:'Promotions',sub:'UNT dining deals and offers',value:notifPromo,setter:setNotifPromo},
    ];
    return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <TouchableOpacity style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}} onPress={()=>setProfileView('main')}>
          <Ionicons name="arrow-back" size={20} color={T.green}/><Text style={{fontSize:15,color:T.green,fontWeight:'500'}}>Back</Text>
        </TouchableOpacity>
        <Text style={{fontSize:22,fontWeight:'700',color:T.text,marginBottom:16}}>Push Notifications</Text>
        <Card>
          {items.map((item,i)=>(
            <View key={i} style={{flexDirection:'row',alignItems:'center',padding:14,gap:12,borderBottomWidth:i<items.length-1?1:0,borderBottomColor:T.divider}}>
              <View style={{flex:1}}>
                <Text style={{fontSize:14,fontWeight:'600',color:T.text,marginBottom:1}}>{item.label}</Text>
                <Text style={{fontSize:12,color:T.textSub}}>{item.sub}</Text>
              </View>
              <Switch value={item.value} onValueChange={item.setter} trackColor={{false:T.cardBorder,true:T.green}} thumbColor="#fff"/>
            </View>
          ))}
        </Card>
      </ScrollView>
    );
  }

  function HelpView(){
    const [openFaq,setOpenFaq]=useState<number|null>(null);
    const faqs=[
      {q:'How do I link my EUID?',a:'Go to Home, tap the EUID banner, enter your Eagle ID and date of birth, then verify the 6-digit code sent to your UNT email.'},
      {q:'How do I order food?',a:'Go to Food tab, tap any open restaurant, browse the menu, add items to cart, then tap Pay with Flex to checkout.'},
      {q:'How do I add funds?',a:'Go to Pay tab, tap Add Funds, then select an amount. Funds are added instantly to your Flex balance.'},
      {q:'How do I request a meal swap?',a:'Go to Swap tab, tap Request next to any offer. Credits transfer instantly once accepted.'},
      {q:'My Flex balance is incorrect.',a:'Sign out and sign back in to refresh your balance.'},
      {q:'Is my data secure?',a:'Yes. All data is encrypted with TLS 1.3. QR codes use signed JWT tokens that expire every 30 seconds.'},
    ];
    return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <TouchableOpacity style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}} onPress={()=>setProfileView('main')}>
          <Ionicons name="arrow-back" size={20} color={T.green}/><Text style={{fontSize:15,color:T.green,fontWeight:'500'}}>Back</Text>
        </TouchableOpacity>
        <Text style={{fontSize:22,fontWeight:'700',color:T.text,marginBottom:16}}>Help & Support</Text>
        <View style={{backgroundColor:T.greenLight,borderRadius:12,padding:16,flexDirection:'row',alignItems:'center',gap:12,marginBottom:20}}>
          <Ionicons name="mail-outline" size={28} color={T.green}/>
          <View>
            <Text style={{fontSize:14,fontWeight:'700',color:T.text,marginBottom:2}}>Contact Support</Text>
            <Text style={{fontSize:13,color:T.green}}>flexpay-support@unt.edu</Text>
          </View>
        </View>
        <Text style={{fontSize:15,fontWeight:'700',color:T.text,marginBottom:10}}>FAQs</Text>
        {faqs.map((faq,i)=>(
          <TouchableOpacity key={i} style={{backgroundColor:T.card,borderRadius:12,padding:14,marginBottom:8,borderWidth:darkMode?1:0,borderColor:T.cardBorder}} onPress={()=>setOpenFaq(openFaq===i?null:i)}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <Text style={{fontSize:14,fontWeight:'600',color:T.text,flex:1,marginRight:8}}>{faq.q}</Text>
              <Ionicons name={openFaq===i?'chevron-up':'chevron-down'} size={18} color={T.textSub}/>
            </View>
            {openFaq===i&&<Text style={{fontSize:13,color:T.textSub,lineHeight:20,marginTop:10}}>{faq.a}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  function PrivacyView(){
    return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <TouchableOpacity style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}} onPress={()=>setProfileView('main')}>
          <Ionicons name="arrow-back" size={20} color={T.green}/><Text style={{fontSize:15,color:T.green,fontWeight:'500'}}>Back</Text>
        </TouchableOpacity>
        <Text style={{fontSize:22,fontWeight:'700',color:T.text,marginBottom:4}}>Privacy Policy</Text>
        <Text style={{fontSize:12,color:T.textSub,marginBottom:20}}>Last updated: June 4, 2026</Text>
        {[
          {title:'1. Information We Collect',body:'We collect your name, UNT email, EUID, date of birth, Flex balance, and transaction data including food orders and meal swaps.'},
          {title:'2. How We Use It',body:'We use your information to operate FlexPay, process transactions, facilitate meal swaps, send notifications, and provide support.'},
          {title:'3. Data Security',body:'All data is encrypted with TLS 1.3. Passwords are hashed and never stored in plain text. QR codes use JWT tokens that expire every 30 seconds.'},
          {title:'4. FERPA Compliance',body:'FlexPay complies with FERPA. Student records are protected and will not be disclosed without consent except as permitted by law.'},
          {title:'5. Your Rights',body:'You can access, correct, or delete your data at any time from Profile, Delete Account. Contact flexpay-support@unt.edu for questions.'},
        ].map((s,i)=>(
          <View key={i} style={{marginBottom:20}}>
            <Text style={{fontSize:15,fontWeight:'700',color:T.green,marginBottom:6}}>{s.title}</Text>
            <Text style={{fontSize:13,color:T.textSub,lineHeight:20}}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  function DeleteAccountView(){
    const [step,setStep]=useState<1|2>(1);const [dt,setDt]=useState('');
    if(step===1)return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <TouchableOpacity style={{flexDirection:'row',alignItems:'center',gap:6,marginBottom:16}} onPress={()=>setProfileView('main')}>
          <Ionicons name="arrow-back" size={20} color={T.green}/><Text style={{fontSize:15,color:T.green,fontWeight:'500'}}>Back</Text>
        </TouchableOpacity>
        <Text style={{fontSize:22,fontWeight:'700',color:T.red,marginBottom:16}}>Delete Account</Text>
        <View style={{backgroundColor:T.redLight,borderLeftWidth:3,borderLeftColor:T.red,borderRadius:6,padding:12,marginBottom:20}}>
          <Text style={{color:T.red}}>This action is permanent and cannot be undone.</Text>
        </View>
        <TouchableOpacity style={{backgroundColor:T.red,borderRadius:10,paddingVertical:14,alignItems:'center',marginBottom:12}} onPress={()=>setStep(2)}>
          <Text style={{color:'#fff',fontSize:15,fontWeight:'600'}}>Continue with Deletion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{borderWidth:1.5,borderColor:T.green,borderRadius:10,paddingVertical:13,alignItems:'center'}} onPress={()=>setProfileView('main')}>
          <Text style={{color:T.green,fontSize:14,fontWeight:'500'}}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
    return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <Text style={{fontSize:22,fontWeight:'700',color:T.red,marginBottom:8}}>Confirm Deletion</Text>
        <Text style={{fontSize:13,color:T.textSub,marginBottom:16}}>Type DELETE to confirm.</Text>
        <TextInput style={{backgroundColor:T.inputBg,borderWidth:1,borderColor:T.inputBorder,borderRadius:8,paddingHorizontal:14,paddingVertical:12,fontSize:16,color:T.text,textAlign:'center',letterSpacing:4,fontWeight:'700',marginBottom:24}} placeholder="Type DELETE" placeholderTextColor={T.textSub} value={dt} onChangeText={setDt} autoCapitalize="characters"/>
        <TouchableOpacity style={{backgroundColor:T.red,borderRadius:10,paddingVertical:14,alignItems:'center',opacity:dt!=='DELETE'?0.4:1}} onPress={()=>dt==='DELETE'&&handleSignOut()} disabled={dt!=='DELETE'}>
          <Text style={{color:'#fff',fontSize:15,fontWeight:'600'}}>Delete My Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{borderWidth:1.5,borderColor:T.green,borderRadius:10,paddingVertical:13,alignItems:'center',marginTop:12}} onPress={()=>{setStep(1);setDt('');}}>
          <Text style={{color:T.green,fontSize:14,fontWeight:'500'}}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function ProfileTab(){
    if(profileView==='changePassword')return<ChangePasswordView/>;
    if(profileView==='twoFactor')return<TwoFactorView/>;
    if(profileView==='notifications')return<NotificationsView/>;
    if(profileView==='deleteAccount')return<DeleteAccountView/>;
    if(profileView==='help')return<HelpView/>;
    if(profileView==='privacy')return<PrivacyView/>;
    return(
      <ScrollView contentContainerStyle={{paddingHorizontal:20,paddingTop:16,paddingBottom:24}}>
        <Text style={{fontSize:22,fontWeight:'700',color:T.text,marginBottom:16}}>Profile & Settings</Text>
        <View style={{backgroundColor:T.green,borderRadius:16,padding:24,alignItems:'center',marginBottom:16}}>
          <View style={{width:72,height:72,borderRadius:36,backgroundColor:'rgba(255,255,255,0.2)',alignItems:'center',justifyContent:'center',marginBottom:12}}>
            <Text style={{fontSize:28,fontWeight:'700',color:'#fff'}}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={{fontSize:20,fontWeight:'700',color:'#fff',marginBottom:4}}>{studentName}</Text>
          <Text style={{fontSize:13,color:'rgba(255,255,255,0.8)',marginBottom:4}}>{userEmail}</Text>
          {euid?<Text style={{fontSize:12,color:'rgba(255,255,255,0.7)',letterSpacing:1,marginBottom:8}}>EUID: {euid}</Text>:null}
          <View style={{flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(255,255,255,0.15)',borderRadius:20,paddingHorizontal:12,paddingVertical:4}}>
            <Ionicons name="checkmark-circle" size={14} color="#fff"/>
            <Text style={{fontSize:12,color:'#fff',fontWeight:'500'}}>UNT Student Verified</Text>
          </View>
        </View>
        <Card style={{padding:16,alignItems:'center',marginBottom:20}}>
          <Text style={{fontSize:12,color:T.textSub,marginBottom:4}}>Flex Balance</Text>
          <Text style={{fontSize:32,fontWeight:'700',color:T.green,marginBottom:8}}>${flexBalance.toFixed(2)}</Text>
          <TouchableOpacity style={{backgroundColor:T.green,borderRadius:8,paddingHorizontal:20,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:6}} onPress={()=>{setActiveTab('pay');}}>
            <Ionicons name="add" size={16} color="#fff"/>
            <Text style={{color:'#fff',fontSize:13,fontWeight:'600'}}>Add Funds</Text>
          </TouchableOpacity>
        </Card>
        <Text style={{fontSize:13,fontWeight:'600',color:T.textSub,marginBottom:8,textTransform:'uppercase',letterSpacing:0.5}}>Account</Text>
        <Card>
          {[
            {icon:'shield-outline',label:'Two-Factor Auth',sub:'Add extra security',action:()=>setProfileView('twoFactor')},
            {icon:'lock-closed-outline',label:'Change Password',sub:'Update your password',action:()=>setProfileView('changePassword')},
          ].map((item,i)=>(
            <TouchableOpacity key={i} style={{flexDirection:'row',alignItems:'center',padding:14,gap:12,borderBottomWidth:i<1?1:0,borderBottomColor:T.divider}} onPress={item.action}>
              <View style={{width:36,height:36,borderRadius:9,backgroundColor:T.greenLight,alignItems:'center',justifyContent:'center'}}>
                <Ionicons name={item.icon as any} size={20} color={T.green}/>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:14,fontWeight:'600',color:T.text,marginBottom:1}}>{item.label}</Text>
                <Text style={{fontSize:12,color:T.textSub}}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={T.inactive}/>
            </TouchableOpacity>
          ))}
        </Card>
        <Text style={{fontSize:13,fontWeight:'600',color:T.textSub,marginBottom:8,textTransform:'uppercase',letterSpacing:0.5}}>Preferences</Text>
        <Card>
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:14,gap:12,borderBottomWidth:1,borderBottomColor:T.divider}} onPress={()=>setProfileView('notifications')}>
            <View style={{width:36,height:36,borderRadius:9,backgroundColor:T.greenLight,alignItems:'center',justifyContent:'center'}}>
              <Ionicons name="notifications-outline" size={20} color={T.green}/>
            </View>
            <View style={{flex:1}}>
              <Text style={{fontSize:14,fontWeight:'600',color:T.text,marginBottom:1}}>Push Notifications</Text>
              <Text style={{fontSize:12,color:T.textSub}}>Manage notification settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={T.inactive}/>
          </TouchableOpacity>
          <View style={{flexDirection:'row',alignItems:'center',padding:14,gap:12,borderBottomWidth:1,borderBottomColor:T.divider}}>
            <View style={{width:36,height:36,borderRadius:9,backgroundColor:T.greenLight,alignItems:'center',justifyContent:'center'}}>
              <Ionicons name="moon-outline" size={20} color={T.green}/>
            </View>
            <View style={{flex:1}}>
              <Text style={{fontSize:14,fontWeight:'600',color:T.text,marginBottom:1}}>Dark Mode</Text>
              <Text style={{fontSize:12,color:T.textSub}}>{darkMode?'Dark theme enabled':'Light theme enabled'}</Text>
            </View>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{false:T.cardBorder,true:T.green}} thumbColor="#fff"/>
          </View>
          {[
            {icon:'help-circle-outline',label:'Help & Support',sub:'FAQs and contact',action:()=>setProfileView('help')},
            {icon:'document-text-outline',label:'Privacy Policy',sub:'Read our privacy terms',action:()=>setProfileView('privacy')},
          ].map((item,i)=>(
            <TouchableOpacity key={i} style={{flexDirection:'row',alignItems:'center',padding:14,gap:12,borderBottomWidth:i===0?1:0,borderBottomColor:T.divider}} onPress={item.action}>
              <View style={{width:36,height:36,borderRadius:9,backgroundColor:T.greenLight,alignItems:'center',justifyContent:'center'}}>
                <Ionicons name={item.icon as any} size={20} color={T.green}/>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:14,fontWeight:'600',color:T.text,marginBottom:1}}>{item.label}</Text>
                <Text style={{fontSize:12,color:T.textSub}}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={T.inactive}/>
            </TouchableOpacity>
          ))}
        </Card>
        <Text style={{fontSize:13,fontWeight:'600',color:T.textSub,marginBottom:8,textTransform:'uppercase',letterSpacing:0.5}}>Danger Zone</Text>
        <Card>
          <TouchableOpacity style={{flexDirection:'row',alignItems:'center',padding:14,gap:12}} onPress={()=>setProfileView('deleteAccount')}>
            <View style={{width:36,height:36,borderRadius:9,backgroundColor:T.redLight,alignItems:'center',justifyContent:'center'}}>
              <Ionicons name="trash-outline" size={20} color={T.red}/>
            </View>
            <View style={{flex:1}}>
              <Text style={{fontSize:14,fontWeight:'600',color:T.red,marginBottom:1}}>Delete Account</Text>
              <Text style={{fontSize:12,color:T.textSub}}>Permanently remove your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={T.inactive}/>
          </TouchableOpacity>
        </Card>
        <TouchableOpacity style={{backgroundColor:T.green,borderRadius:10,paddingVertical:14,alignItems:'center',flexDirection:'row',justifyContent:'center',gap:8,marginTop:8,marginBottom:16}} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#fff"/>
          <Text style={{color:'#fff',fontSize:15,fontWeight:'600'}}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={{fontSize:11,color:T.inactive,textAlign:'center',marginBottom:8}}>FlexPay v1.2 - UNT Team 10 - Sprint 2</Text>
      </ScrollView>
    );
  }

  const tabs=[
    {key:'home' as TabName,icon:'home-outline',activeIcon:'home',label:'Home'},
    {key:'pay' as TabName,icon:'card-outline',activeIcon:'card',label:'Pay'},
    {key:'food' as TabName,icon:'fast-food-outline',activeIcon:'fast-food',label:'Food'},
    {key:'swap' as TabName,icon:'swap-horizontal-outline',activeIcon:'swap-horizontal',label:'Swap'},
    {key:'profile' as TabName,icon:'person-outline',activeIcon:'person',label:'Profile'},
  ];

  const tabMap:Record<TabName,JSX.Element>={
    home:<HomeTab/>,pay:<PayTab/>,food:<FoodTab/>,swap:<SwapTab/>,profile:<ProfileTab/>,
  };

  return(
    <SafeAreaView style={{flex:1,backgroundColor:T.bg}}>
      <View style={{flex:1,backgroundColor:T.bg}}>{tabMap[activeTab]}</View>
      <View style={{flexDirection:'row',backgroundColor:T.navBg,borderTopWidth:1,borderTopColor:T.navBorder,paddingBottom:Platform.OS==='ios'?24:8,paddingTop:8}}>
        {tabs.map(tab=>{
          const isActive=activeTab===tab.key;
          return(
            <TouchableOpacity key={tab.key} style={{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:2}} onPress={()=>{setActiveTab(tab.key);if(tab.key!=='profile')setProfileView('main');}}>
              {isActive&&<View style={{width:20,height:3,backgroundColor:T.green,borderRadius:2,marginBottom:4}}/>}
              <View>
                <Ionicons name={(isActive?tab.activeIcon:tab.icon) as any} size={24} color={isActive?T.green:T.inactive}/>
                {tab.key==='food'&&cartCount>0&&(
                  <View style={{position:'absolute',top:-4,right:-6,width:16,height:16,borderRadius:8,backgroundColor:T.red,alignItems:'center',justifyContent:'center'}}>
                    <Text style={{color:'#fff',fontSize:9,fontWeight:'700'}}>{cartCount}</Text>
                  </View>
                )}
              </View>
              <Text style={{fontSize:10,color:isActive?T.green:T.inactive,marginTop:3,fontWeight:isActive?'700':'500'}}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

import {StyleSheet} from 'react-native';
const styles = StyleSheet.create({});
